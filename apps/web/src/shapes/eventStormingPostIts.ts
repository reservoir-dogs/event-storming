import {
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  GeoShapeGeoStyle,
  createShapeId,
  type Editor,
  type StyleProp,
  type TLShapeId,
  type VecLike,
} from 'tldraw'
import { setSelectedKind } from './eventStormingKindSelection'
import type { EventStormingKind } from './eventStormingKinds'

// Taille de référence commune à tous les post-its : celle que tldraw attribue nativement à
// n'importe quel rectangle créé d'un simple clic (avant tout agrandissement lié au contenu du
// libellé), et qui correspond à la taille observée pour le post-it "Acteur". Elle est imposée par
// `FixedSizeGeoShapeUtil` ; elle n'est reprise ici que pour centrer un post-it sur un point.
export const POST_IT_SIZE = { w: 200, h: 200 }

// `DefaultLabelColorStyle`, le style tldraw utilisé pour le libellé d'un `geo`, n'est pas exporté
// par le paquet `tldraw` (seul `DefaultColorStyle`, celui de la bordure, l'est). `editor.styleProps`
// donne accès à l'instance de style réellement enregistrée pour chaque prop d'un type de shape :
// c'est elle qu'il faut passer à `setStyleForNextShapes` pour que l'outil `geo` en tienne compte.
function labelColorStyleProp(editor: Editor): StyleProp<string> | undefined {
  for (const [style, propKey] of editor.styleProps.geo) {
    if (propKey === 'labelColor') return style as StyleProp<string>
  }
  return undefined
}

// Les post-its sont créés comme des rectangles (outil `geo`) à bordure solide et fond
// teinté dans la même couleur, colorés par type, plutôt que des notes tldraw à fond plein
// (voir le gestionnaire `registerAfterCreateHandler` dans WorkshopPage qui rouvre l'édition
// du libellé juste après la création, pour retrouver le confort de saisie immédiate des notes).
// `tldraw` ne propose pas un curseur d'opacité de remplissage en pourcentage exact : le style
// de remplissage `solid` (malgré son nom) utilise en réalité la teinte pastel/atténuée propre à
// chaque couleur (ex: bleu -> bleu pastel), ce qui est l'équivalent visuel le plus proche d'un
// fond à ~30% d'opacité de la même couleur sur un canvas blanc. Le style `semi` a été écarté :
// il utilise une couleur de recouvrement neutre, indépendante de la couleur du type.
// Le point chaud et la question s'en écartent : leur fond prend la couleur pleine du type (style
// `fill`) et leur libellé passe en blanc, seule façon de les distinguer des deux types qui
// partagent leur couleur (système en rouge, message d'intégration en vert).
export function applyPostItStyles(editor: Editor, kind: EventStormingKind) {
  const isStrong = kind.fillEmphasis === 'strong'
  editor.setStyleForNextShapes(DefaultColorStyle, kind.color)
  const labelColorStyle = labelColorStyleProp(editor)
  if (labelColorStyle) editor.setStyleForNextShapes(labelColorStyle, isStrong ? 'white' : 'black')
  editor.setStyleForNextShapes(DefaultFontStyle, 'sans')
  editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
  editor.setStyleForNextShapes(DefaultFillStyle, isStrong ? 'fill' : 'solid')
  editor.setStyleForNextShapes(GeoShapeGeoStyle, 'rectangle')
  // Mémorise le type armé, qui sera estampé sur le prochain post-it créé
  // (`getInitialMetaForShape` dans `WorkshopPage`) : la couleur ne suffit plus à l'identifier.
  setSelectedKind(kind)
}

// Arme la création de post-its d'un type donné : le prochain clic sur le canvas crée ce post-it.
export function armPostItTool(editor: Editor, kind: EventStormingKind) {
  applyPostItStyles(editor, kind)
  editor.setCurrentTool('geo')
}

// Crée immédiatement un post-it centré sur un point de la page, sans passer par l'outil `geo` :
// utilisé par le glisser-déposer depuis la barre d'outils, où le geste de dépôt tient lieu de clic.
// `createShape` applique les styles du prochain shape posés juste avant.
// Le couloir de nage d'accueil est déterminé ici, à partir du point de dépôt : le rattachement
// automatique de tldraw se fonderait sur le coin haut-gauche du post-it, à une demi-largeur du point
// visé, et laisserait donc au bord du couloir une bande où le post-it déposé n'y serait pas rattaché.
export function createPostItAtPagePoint(editor: Editor, kind: EventStormingKind, center: VecLike): TLShapeId {
  applyPostItStyles(editor, kind)

  const topLeft = { x: center.x - POST_IT_SIZE.w / 2, y: center.y - POST_IT_SIZE.h / 2 }
  const swimlane = editor.getShapeAtPoint(center, {
    hitInside: true,
    hitFrameInside: true,
    filter: (shape) => shape.type === 'frame',
  })
  // Les coordonnées d'un shape rattaché à un couloir de nage sont exprimées dans le repère de
  // celui-ci, et tldraw ne fait cette conversion que lorsqu'il choisit lui-même le parent.
  const position = swimlane ? editor.getPointInShapeSpace(swimlane, topLeft) : topLeft

  const id = createShapeId()
  editor.markHistoryStoppingPoint('create post-it')
  editor.createShape({
    id,
    type: 'geo',
    parentId: swimlane?.id,
    x: position.x,
    y: position.y,
  })
  editor.select(id)

  return id
}
