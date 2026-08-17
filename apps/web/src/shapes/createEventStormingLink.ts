import { createShapeId, type Editor, type TLShapeId } from 'tldraw'

// Ancrage au centre du post-it, non précis : c'est ce que fait tldraw quand on relâche une flèche
// au milieu d'une forme. La flèche part alors du bord le plus proche et suit les deux post-its
// quand ils sont déplacés — ce que l'export Mermaid exige pour reconnaître un lien.
const CENTER_ANCHOR = { x: 0.5, y: 0.5 }

function terminalBindingProps(terminal: 'start' | 'end') {
  return { terminal, normalizedAnchor: CENTER_ANCHOR, isExact: false, isPrecise: false, snap: 'none' } as const
}

// Relie deux post-its par une flèche attachée à ses deux extrémités. La flèche et ses deux liaisons
// sont créées dans une seule transaction précédée d'un point d'arrêt d'historique : un `undo` défait
// le lien entier, jamais une flèche orpheline.
// Sert aux trois chemins de création de lien : poignée de connexion, commande « Relier la
// sélection », et toute création programmatique.
export function createEventStormingLink(
  editor: Editor,
  fromId: TLShapeId,
  toId: TLShapeId,
): TLShapeId | undefined {
  if (fromId === toId) return undefined

  const fromBounds = editor.getShapePageBounds(fromId)
  const toBounds = editor.getShapePageBounds(toId)
  if (!fromBounds || !toBounds) return undefined

  const arrowId = createShapeId()
  editor.markHistoryStoppingPoint('create event storming link')
  editor.run(() => {
    // La flèche est créée à l'origine de la page : ses terminaux sont donc exprimés directement en
    // coordonnées de page, avant que les liaisons ne prennent le relais du positionnement.
    editor.createShape({
      id: arrowId,
      type: 'arrow',
      x: 0,
      y: 0,
      props: {
        start: { x: fromBounds.center.x, y: fromBounds.center.y },
        end: { x: toBounds.center.x, y: toBounds.center.y },
      },
    })
    editor.createBinding({ type: 'arrow', fromId: arrowId, toId: fromId, props: terminalBindingProps('start') })
    editor.createBinding({ type: 'arrow', fromId: arrowId, toId: toId, props: terminalBindingProps('end') })
  })

  return arrowId
}
