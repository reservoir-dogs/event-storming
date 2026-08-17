import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DefaultFontStyle,
  Tldraw,
  inlineBase64AssetStore,
  startEditingShapeWithRichText,
  type Editor,
  type TLComponents,
  type TLUiOverrides,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { useSync } from '@tldraw/sync'
import { publishThumbnailUpdate } from '../api/thumbnailUpdates'
import { updateWorkshopThumbnail } from '../api/workshops'
import { SYNC_URL } from '../config'
import { PARTICIPANT_COLORS } from '../config/participantColors'
import { useParticipantName } from '../hooks/useParticipantName'
import { useWorkshop } from '../hooks/useWorkshop'
import { exposeEditorForTesting } from '../testHooks'
import { ConnectionHandlesOverlay } from '../components/ConnectionHandlesOverlay'
import { EventStormingMainMenu } from '../components/EventStormingMainMenu'
import { EventStormingToolbar } from '../components/EventStormingToolbar'
import { WorkshopOverlay } from '../components/WorkshopOverlay'
import { getSelectedKind } from '../shapes/eventStormingKindSelection'
import { getDraggedKind, isDropOnToolbar, isKindDrag } from '../shapes/eventStormingKindDrag'
import { createPostItAtPagePoint } from '../shapes/eventStormingPostIts'
import { FixedSizeGeoShapeUtil, UnlabeledArrowShapeUtil } from '../shapes/eventStormingShapeUtils'
import { ES_KIND_META_KEY } from '../shapes/resolveEventStormingKind'

// Les poignées de connexion apparaissent au-dessus du canvas, comme les panneaux de l'atelier :
// tldraw n'accepte qu'un seul composant à cet emplacement, ils sont donc rendus ensemble.
function CanvasOverlays() {
  return (
    <>
      <WorkshopOverlay />
      <ConnectionHandlesOverlay />
    </>
  )
}

const COMPONENTS: TLComponents = {
  Toolbar: EventStormingToolbar,
  // Le panneau de style est entièrement retiré : la couleur, la police, le remplissage et
  // le trait des post-its sont déjà imposés par leur type (voir `EventStormingToolbar`).
  StylePanel: null,
  InFrontOfTheCanvas: CanvasOverlays,
  // Une seule page par atelier : le sélecteur de page natif de tldraw est superflu.
  PageMenu: null,
  // La barre de mise en forme du texte (gras/alignement) fait doublon avec la simplification
  // déjà apportée à l'édition pour l'event storming.
  RichTextToolbar: null,
  MainMenu: EventStormingMainMenu,
}

const SHAPE_UTILS = [FixedSizeGeoShapeUtil, UnlabeledArrowShapeUtil]

// Les lettres seules E/C/X/A/P/S/I/H/Q (cf. `eventStormingKinds.ts`) sélectionnent les types de
// post-its via le gestionnaire `keydown` de `EventStormingToolbar`, indépendant du système de
// raccourcis natif de tldraw. Plusieurs de ces lettres coïncident cependant avec des raccourcis
// natifs (gomme/e, dessin/x, flèche/a, main/h, verrouillage d'outil/q) : on les désactive ou on les
// déplace vers une autre lettre ici, pour que ces deux systèmes de raccourcis ne se déclenchent
// jamais tous les deux sur la même touche. 'S' (Système) et 'I' (Message d'intégration) n'ont, eux,
// aucun équivalent natif à neutraliser.
const EDITOR_OVERRIDES: TLUiOverrides = {
  tools(_editor, tools) {
    return {
      ...tools,
      // 'x' retiré (Acteur) ; 'd'/'b' restent des raccourcis valides pour l'outil dessin.
      draw: { ...tools.draw, kbd: 'd,b' },
      // Renommés : Lien = L (outil flèche natif, libère 'a' pour Agrégat).
      arrow: { ...tools.arrow, kbd: 'l' },
      // Gomme = G (outil gomme natif, libère 'e' pour Événement de domaine).
      eraser: { ...tools.eraser, kbd: 'g' },
      // Couloir de nage = N (outil frame natif, libère 'f' — non réattribué).
      frame: { ...tools.frame, kbd: 'n' },
      // Libère 'h' pour Point chaud : l'outil main reste accessible en maintenant la barre d'espace
      // ou par un glissé à la molette, sans raccourci de lettre.
      hand: { ...tools.hand, kbd: undefined },
      // Outils non utilisés dans cette application : leurs raccourcis natifs ('n' et 'l')
      // sont désormais pris par frame/arrow ci-dessus, donc retirés ici pour éviter le doublon.
      note: { ...tools.note, kbd: undefined },
      line: { ...tools.line, kbd: undefined },
    }
  },
  actions(_editor, actions) {
    return {
      ...actions,
      // Libère 'q' pour Question.
      'toggle-tool-lock': { ...actions['toggle-tool-lock'], kbd: undefined },
      // Libère 'g' entièrement pour la Gomme (cf. tools.eraser ci-dessus).
      'select-geo-tool': { ...actions['select-geo-tool'], kbd: undefined },
    }
  },
}

// Contrairement à l'outil `note`, l'outil `geo` (utilisé pour les post-its afin d'obtenir
// une bordure solide et un fond teinté) n'ouvre pas automatiquement l'édition du libellé
// après un clic. On restaure ce confort de saisie immédiate en interceptant la création
// de tout rectangle (seul usage de `geo` dans cette application).
function enableImmediateLabelEditing(editor: Editor) {
  editor.sideEffects.registerAfterCreateHandler('shape', (shape) => {
    if (shape.type !== 'geo') return
    editor.timers.requestAnimationFrame(() => {
      if (editor.getShape(shape.id)) {
        startEditingShapeWithRichText(editor, shape.id, { selectAll: true })
      }
    })
  })
}

// Le type d'event storming d'un post-it est estampé sur le shape à sa création : deux types
// partagent désormais une même couleur (système/point chaud en rouge, message d'intégration/question
// en vert), qui ne suffit donc plus à retrouver le type — dont l'export Mermaid a besoin.
// Ce point d'entrée couvre tous les chemins de création (clic sur le canvas, glisser-déposer depuis
// la barre d'outils) ; un post-it dupliqué ou collé conserve, lui, le type de son original, car
// tldraw laisse la `meta` déjà portée par le shape écraser cette valeur initiale.
function markCreatedPostItsWithTheirKind(editor: Editor) {
  editor.getInitialMetaForShape = (shape) =>
    shape.type === 'geo' ? { [ES_KIND_META_KEY]: getSelectedKind().id } : {}
}

// Le glisser-déposer d'un type de post-it est traité en phase de capture : tldraw intercepte
// `dragover` et `drop` sur son propre conteneur et interrompt leur propagation (il y gère le dépôt de
// fichiers et d'images), donc un gestionnaire en phase de remontée ne serait jamais appelé.
// Le glissé d'un type est de plus toujours consommé ici, même relâché sur la barre d'outils :
// laisser filer l'événement conduirait tldraw à le redispatcher sur son canvas, et ce second
// événement — dont la cible n'est plus la barre — créerait le post-it que ce geste abandonné ne
// demande pas.
function handleKindDragOver(event: React.DragEvent<HTMLDivElement>) {
  if (!isKindDrag(event.dataTransfer)) return
  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer.dropEffect = isDropOnToolbar(event.target) ? 'none' : 'copy'
}

// Les flèches ne servent qu'à relier des éléments : leur couleur reste toujours noire, quel que
// soit le type de post-it sélectionné juste avant (bouton "Lien" ou raccourci natif tldraw `l`).
function forceArrowColorBlack(editor: Editor) {
  editor.sideEffects.registerBeforeCreateHandler('shape', (shape) => {
    if (shape.type !== 'arrow' || shape.props.color === 'black') return shape
    return { ...shape, props: { ...shape.props, color: 'black' } }
  })
}

// Délai après la dernière modification du board avant de générer et d'envoyer un nouvel aperçu.
const THUMBNAIL_DEBOUNCE_MS = 4500
// Largeur cible (px) de l'aperçu généré, pour garder un payload raisonnable en base de données.
const THUMBNAIL_TARGET_WIDTH = 480

// Le serveur n'a pas de DOM et ne peut donc pas rendre le board tldraw : l'aperçu est généré ici,
// côté client, à partir de l'éditeur réellement monté, puis envoyé au serveur pour persistance.
// Best-effort : un échec de génération ou d'envoi ne doit jamais perturber l'édition du board.
async function captureAndSendThumbnail(editor: Editor, workshopId: string) {
  const shapeIds = editor.getCurrentPageShapeIds()
  if (shapeIds.size === 0) return

  const bounds = editor.getCurrentPageBounds()
  if (!bounds || bounds.width === 0) return

  try {
    const { url } = await editor.toImageDataUrl([...shapeIds], {
      format: 'png',
      background: true,
      scale: Math.min(1, THUMBNAIL_TARGET_WIDTH / bounds.width),
      pixelRatio: 1,
    })
    // Diffusé avant même la persistance serveur : si l'utilisateur quitte l'atelier juste après,
    // la page d'accueil doit afficher ce nouvel aperçu sans attendre le round-trip réseau.
    publishThumbnailUpdate(workshopId, url)
    await updateWorkshopThumbnail(workshopId, url)
  } catch {
    // Silencieux : ce n'est qu'un aperçu, pas une donnée critique de l'atelier.
  }
}

function assignDistinctParticipantColor(editor: Editor) {
  const takenColors = new Set(editor.getCollaboratorsOnCurrentPage().map((collaborator) => collaborator.color))
  const currentColor = editor.user.getColor()
  if (!takenColors.has(currentColor)) return

  const freeColor = PARTICIPANT_COLORS.find((color) => !takenColors.has(color))
  if (freeColor) {
    editor.user.updateUserPreferences({ color: freeColor })
  }
}

export function WorkshopPage() {
  const { id } = useParams<{ id: string }>()
  const { status } = useWorkshop(id)
  const { name } = useParticipantName()
  // L'éditeur n'existe qu'une fois tldraw monté : le dépôt d'un type glissé depuis la barre d'outils
  // en a besoin, sans que ce geste doive provoquer un rendu de la page.
  const editorRef = useRef<Editor | null>(null)

  const store = useSync({
    uri: `${SYNC_URL}/connect/${id}`,
    assets: inlineBase64AssetStore,
  })

  function handleMount(editor: Editor) {
    editorRef.current = editor
    exposeEditorForTesting(editor)
    if (name) {
      editor.user.updateUserPreferences({ name })
    }
    editor.setStyleForNextShapes(DefaultFontStyle, 'sans')
    enableImmediateLabelEditing(editor)
    forceArrowColorBlack(editor)
    markCreatedPostItsWithTheirKind(editor)
    // Mode grille et accrochage aux points toujours actifs pour faciliter l'alignement des
    // post-its, sans bascule possible (voir `EventStormingMainMenu`).
    editor.updateInstanceState({ isGridMode: true })
    editor.user.updateUserPreferences({ isSnapMode: true })
    // Laisse le temps à la présence des autres participants de se synchroniser avant
    // de vérifier une éventuelle collision de couleur.
    editor.timers.setTimeout(() => assignDistinctParticipantColor(editor), 300)

    if (!id) return undefined

    let dirty = false
    let debounceTimer: ReturnType<typeof setTimeout> | undefined

    const stopListening = editor.store.listen(
      () => {
        dirty = true
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          dirty = false
          void captureAndSendThumbnail(editor, id)
        }, THUMBNAIL_DEBOUNCE_MS)
      },
      { source: 'user', scope: 'document' },
    )

    return () => {
      stopListening()
      clearTimeout(debounceTimer)
      // Capture un dernier aperçu à jour si l'utilisateur quitte juste après une modification,
      // sans attendre la fin du debounce.
      if (dirty) {
        void captureAndSendThumbnail(editor, id)
      }
    }
  }

  if (status === 'not-found') {
    return (
      <div style={{ padding: 24 }}>
        <p>Cet atelier n'existe pas.</p>
        <Link to="/">Retour à l'accueil</Link>
      </div>
    )
  }

  function handleKindDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!isKindDrag(event.dataTransfer)) return
    event.preventDefault()
    event.stopPropagation()
    if (isDropOnToolbar(event.target)) return

    const editor = editorRef.current
    const kind = getDraggedKind(event.dataTransfer)
    if (!editor || !kind) return

    createPostItAtPagePoint(editor, kind, editor.screenToPage({ x: event.clientX, y: event.clientY }))
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0 }}
      onDragOverCapture={handleKindDragOver}
      onDropCapture={handleKindDrop}
    >
      <Tldraw
        store={store}
        components={COMPONENTS}
        shapeUtils={SHAPE_UTILS}
        overrides={EDITOR_OVERRIDES}
        onMount={handleMount}
      />
    </div>
  )
}
