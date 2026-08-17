import { getArrowBindings, renderPlaintextFromRichText, type Editor, type TLShape, type TLShapeId } from 'tldraw'
import { KIND_COLOR_HEX, MERMAID_EXCLUDED_KIND_IDS } from '../shapes/eventStormingKinds'
import { resolveEventStormingKind } from '../shapes/resolveEventStormingKind'

function sanitizeLabel(label: string): string {
  return label.replaceAll('"', "'").replaceAll(/\r?\n/g, '<br/>')
}

// Un post-it est exporté sauf si son type figure explicitement parmi les exclusions (point chaud,
// question). Un post-it dont le type ne peut pas être déterminé est exporté : mieux vaut un nœud de
// trop qu'une disparition silencieuse du diagramme.
function isExportedPostIt(shape: TLShape): boolean {
  if (shape.type !== 'geo') return false
  const kind = resolveEventStormingKind(shape)
  return !kind || !MERMAID_EXCLUDED_KIND_IDS.includes(kind.id)
}

function shapeLabel(editor: Editor, shape: TLShape): string {
  if (shape.type === 'frame') {
    return shape.props.name.trim() || 'Couloir de nage'
  }
  if (shape.type === 'geo') {
    const text = renderPlaintextFromRichText(editor, shape.props.richText).trim()
    return text || '(sans libellé)'
  }
  return shape.id
}

function nodeLine(editor: Editor, shape: TLShape, idFor: (id: TLShapeId) => string, indent: string): string {
  return `${indent}${idFor(shape.id)}["${sanitizeLabel(shapeLabel(editor, shape))}"]`
}

function frameLines(
  editor: Editor,
  frame: TLShape,
  idFor: (id: TLShapeId) => string,
  exportedIds: ReadonlySet<TLShapeId>,
): string[] {
  const lines = [`  subgraph ${idFor(frame.id)}["${sanitizeLabel(shapeLabel(editor, frame))}"]`]
  for (const childId of editor.getSortedChildIdsForParent(frame.id)) {
    const child = editor.getShape(childId)
    if (child && exportedIds.has(child.id)) lines.push(nodeLine(editor, child, idFor, '    '))
  }
  lines.push('  end')
  return lines
}

function styleLine(shape: TLShape, idFor: (id: TLShapeId) => string): string | undefined {
  if (shape.type !== 'geo') return undefined
  const color = KIND_COLOR_HEX[shape.props.color]
  return color ? `  style ${idFor(shape.id)} fill:${color}33,stroke:${color}` : undefined
}

function edgeLine(
  editor: Editor,
  shape: TLShape,
  idFor: (id: TLShapeId) => string,
  exportedIds: ReadonlySet<TLShapeId>,
): string | undefined {
  if (shape.type !== 'arrow') return undefined
  const { start, end } = getArrowBindings(editor, shape)
  if (!start || !end) return undefined
  // Les deux extrémités doivent être exportées : Mermaid crée silencieusement un nœud sans libellé
  // pour tout identifiant référencé par une arête, ce qui ferait réapparaître un point chaud ou une
  // question sous la forme d'un nœud fantôme.
  if (!exportedIds.has(start.toId) || !exportedIds.has(end.toId)) return undefined
  return `  ${idFor(start.toId)} --> ${idFor(end.toId)}`
}

// Génère un diagramme Mermaid (`flowchart TD`) à partir du canvas courant : chaque post-it
// devient un nœud, chaque couloir de nage un `subgraph` contenant les post-its qu'il englobe
// (relation native de parenté tldraw entre un frame et ses enfants), et chaque lien une arête
// entre les deux éléments qu'il relie. Les liens non reliés à un élément à chaque extrémité sont
// ignorés : ils n'ont pas de sens dans un graphe de nœuds identifiés.
// Les points chauds et les questions sont laissés de côté : ils matérialisent des incertitudes
// d'atelier et non des étapes du flux (l'export PNG, lui, reste une capture exhaustive du canvas).
export function buildMermaidFlowchart(editor: Editor): string {
  const shapes = editor.getCurrentPageShapes()
  const mermaidIds = new Map<TLShapeId, string>()
  let nextId = 0
  const idFor = (shapeId: TLShapeId) => {
    let id = mermaidIds.get(shapeId)
    if (!id) {
      id = `n${nextId++}`
      mermaidIds.set(shapeId, id)
    }
    return id
  }

  const exportedPostIts = shapes.filter(isExportedPostIt)
  const exportedIds = new Set(exportedPostIts.map((shape) => shape.id))

  const frames = shapes.filter((shape) => shape.type === 'frame')
  const framedShapeIds = new Set(frames.flatMap((frame) => editor.getSortedChildIdsForParent(frame.id)))
  const topLevelPostIts = exportedPostIts.filter((shape) => !framedShapeIds.has(shape.id))

  const lines = [
    'flowchart TD',
    ...frames.flatMap((frame) => frameLines(editor, frame, idFor, exportedIds)),
    ...topLevelPostIts.map((postIt) => nodeLine(editor, postIt, idFor, '  ')),
    ...exportedPostIts.map((postIt) => styleLine(postIt, idFor)).filter((line) => line !== undefined),
    ...shapes.map((shape) => edgeLine(editor, shape, idFor, exportedIds)).filter((line) => line !== undefined),
  ]

  return lines.join('\n')
}
