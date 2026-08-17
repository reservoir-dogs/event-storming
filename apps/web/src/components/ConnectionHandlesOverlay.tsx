import { useEffect, useState } from 'react'
import { track, useEditor, type Editor, type TLShapeId, type VecLike } from 'tldraw'
import { createEventStormingLink } from '../shapes/createEventStormingLink'
import { resolveEventStormingKind } from '../shapes/resolveEventStormingKind'

const HANDLE_SIZE = 14
const HANDLE_COLOR = '#1971c2'

type DragState = {
  fromId: TLShapeId
  // Point de la page suivi par le pointeur, que nous suivons nous-mêmes puisque le canvas ne reçoit
  // pas ce geste : il ne sert qu'à tracer l'aperçu du lien.
  toPagePoint: VecLike
}

// Le post-it sous un point de la page, hors post-it d'origine du geste : seuls les post-its peuvent
// recevoir un lien (ni couloir de nage, ni autre lien).
function postItAtPagePoint(editor: Editor, pagePoint: VecLike, excludedId: TLShapeId): TLShapeId | undefined {
  const shape = editor.getShapeAtPoint(pagePoint, {
    hitInside: true,
    filter: (candidate) => candidate.id !== excludedId && resolveEventStormingKind(candidate) !== undefined,
  })
  return shape?.id
}

function pageCenterOf(editor: Editor, shapeId: TLShapeId): VecLike | undefined {
  const bounds = editor.getShapePageBounds(shapeId)
  return bounds ? { x: bounds.center.x, y: bounds.center.y } : undefined
}

// Milieux des quatre bords d'un post-it, en coordonnées de page : points de départ possibles d'un
// lien.
function handlePagePoints(editor: Editor, shapeId: TLShapeId): VecLike[] {
  const bounds = editor.getShapePageBounds(shapeId)
  if (!bounds) return []
  return [
    { x: bounds.center.x, y: bounds.minY },
    { x: bounds.maxX, y: bounds.center.y },
    { x: bounds.center.x, y: bounds.maxY },
    { x: bounds.minX, y: bounds.center.y },
  ]
}

// Poignées de connexion affichées au survol d'un post-it : un glissé depuis l'une d'elles jusqu'à un
// autre post-it crée le lien entre les deux, sans passer par l'outil « Lien » ni viser le tracé.
export const ConnectionHandlesOverlay = track(function ConnectionHandlesOverlay() {
  const editor = useEditor()
  const [drag, setDrag] = useState<DragState | null>(null)

  // `select.idle` est le seul état où les poignées ont un sens : il exclut les autres outils, la
  // saisie d'un libellé, le déplacement d'un post-it et la sélection au lasso.
  const isIdleSelection = editor.isIn('select.idle')
  const hoveredId = editor.getHoveredShapeId()
  const hoveredShape = hoveredId ? editor.getShape(hoveredId) : undefined
  const isPostItHovered = hoveredShape !== undefined && resolveEventStormingKind(hoveredShape) !== undefined
  const originId = drag?.fromId ?? (isIdleSelection && isPostItHovered ? hoveredId : undefined)

  // Le geste ne dépend que du post-it dont la poignée a été saisie : la cible est relue à chaque
  // mouvement et au relâchement, à partir de la position réelle du pointeur. S'appuyer sur la cible
  // mémorisée dans l'état exposerait à relâcher avant que le rendu du dernier mouvement n'ait eu
  // lieu, et donc à perdre le lien.
  const dragFromId = drag?.fromId
  useEffect(() => {
    if (!dragFromId) return

    const fromId = dragFromId

    function targetAt(event: PointerEvent) {
      const pagePoint = editor.screenToPage({ x: event.clientX, y: event.clientY })
      return { pagePoint, targetId: postItAtPagePoint(editor, pagePoint, fromId) }
    }

    function handlePointerMove(event: PointerEvent) {
      const { pagePoint, targetId } = targetAt(event)
      // Réutilise la mise en évidence native de tldraw pour signaler la cible du lien.
      editor.setHintingShapes(targetId ? [targetId] : [])
      setDrag({ fromId, toPagePoint: pagePoint })
    }

    function handlePointerUp(event: PointerEvent) {
      const { targetId } = targetAt(event)
      if (targetId) {
        createEventStormingLink(editor, fromId, targetId)
      }
      editor.setHintingShapes([])
      editor.setCurrentTool('select')
      setDrag(null)
    }

    globalThis.addEventListener('pointermove', handlePointerMove)
    globalThis.addEventListener('pointerup', handlePointerUp)
    globalThis.addEventListener('pointercancel', handlePointerUp)
    return () => {
      globalThis.removeEventListener('pointermove', handlePointerMove)
      globalThis.removeEventListener('pointerup', handlePointerUp)
      globalThis.removeEventListener('pointercancel', handlePointerUp)
      // Un démontage en cours de geste (changement de page, déconnexion) ne doit pas laisser un
      // post-it mis en évidence indéfiniment.
      editor.setHintingShapes([])
    }
  }, [editor, dragFromId])

  if (!originId) return null

  const originCenter = pageCenterOf(editor, originId)
  if (!originCenter) return null

  const previewFrom = editor.pageToViewport(originCenter)
  const previewTo = drag ? editor.pageToViewport(drag.toPagePoint) : undefined

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 250 }}>
      {previewTo && (
        <svg style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <line
            x1={previewFrom.x}
            y1={previewFrom.y}
            x2={previewTo.x}
            y2={previewTo.y}
            stroke={HANDLE_COLOR}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </svg>
      )}

      {!drag &&
        handlePagePoints(editor, originId).map((pagePoint) => {
          const { x, y } = editor.pageToViewport(pagePoint)
          return (
            <button
              key={`${pagePoint.x},${pagePoint.y}`}
              type="button"
              title="Faire glisser vers un autre post-it pour créer un lien"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setDrag({ fromId: originId, toPagePoint: pagePoint })
              }}
              style={{
                position: 'absolute',
                left: x - HANDLE_SIZE / 2,
                top: y - HANDLE_SIZE / 2,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: '50%',
                border: `2px solid ${HANDLE_COLOR}`,
                background: 'white',
                padding: 0,
                cursor: 'crosshair',
                pointerEvents: 'all',
              }}
            />
          )
        })}
    </div>
  )
})
