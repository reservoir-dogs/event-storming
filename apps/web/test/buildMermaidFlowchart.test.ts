import { describe, expect, it, vi } from 'vitest'
import type { Editor, TLShape, TLShapeId } from 'tldraw'

// Le générateur n'a besoin de tldraw que pour deux lectures (les liaisons d'une flèche, le texte
// brut d'un libellé) : les simuler évite de monter un véritable éditeur pour tester la génération.
vi.mock('tldraw', () => ({
  getArrowBindings: (_editor: unknown, shape: { bindings?: unknown }) => shape.bindings ?? {},
  renderPlaintextFromRichText: (_editor: unknown, richText: { text?: string }) => richText?.text ?? '',
}))

const { buildMermaidFlowchart } = await import('../src/export/buildMermaidFlowchart')
const { EVENT_STORMING_KINDS } = await import('../src/shapes/eventStormingKinds')

const PAGE_ID = 'page:page' as TLShapeId

function postIt(id: string, kindId: string, label: string, parentId: string = PAGE_ID): TLShape {
  const kind = EVENT_STORMING_KINDS.find((candidate) => candidate.id === kindId)
  if (!kind) throw new Error(`Unknown kind: ${kindId}`)
  return {
    id: `shape:${id}`,
    type: 'geo',
    parentId,
    props: { color: kind.color, fill: 'solid', richText: { text: label } },
    meta: { esKind: kind.id },
  } as unknown as TLShape
}

function legacyPostIt(id: string, color: string, label: string): TLShape {
  return {
    id: `shape:${id}`,
    type: 'geo',
    parentId: PAGE_ID,
    props: { color, fill: 'solid', richText: { text: label } },
    meta: {},
  } as unknown as TLShape
}

function swimlane(id: string, name: string): TLShape {
  return { id: `shape:${id}`, type: 'frame', parentId: PAGE_ID, props: { name }, meta: {} } as unknown as TLShape
}

function link(id: string, fromId: string, toId: string): TLShape {
  return {
    id: `shape:${id}`,
    type: 'arrow',
    parentId: PAGE_ID,
    props: {},
    meta: {},
    bindings: { start: { toId: `shape:${fromId}` }, end: { toId: `shape:${toId}` } },
  } as unknown as TLShape
}

function unboundLink(id: string, fromId: string): TLShape {
  return {
    id: `shape:${id}`,
    type: 'arrow',
    parentId: PAGE_ID,
    props: {},
    meta: {},
    bindings: { start: { toId: `shape:${fromId}` } },
  } as unknown as TLShape
}

function fakeEditor(shapes: TLShape[]): Editor {
  const byId = new Map(shapes.map((shape) => [shape.id, shape]))
  return {
    getCurrentPageShapes: () => shapes,
    getShape: (id: TLShapeId) => byId.get(id),
    getSortedChildIdsForParent: (parentId: TLShapeId) =>
      shapes.filter((shape) => shape.parentId === parentId).map((shape) => shape.id),
  } as unknown as Editor
}

describe('buildMermaidFlowchart', () => {
  it('renders exported post-its, swimlanes and links', () => {
    const mermaid = buildMermaidFlowchart(
      fakeEditor([
        postIt('a', 'command', 'Passer commande'),
        postIt('b', 'domain-event', 'Commande passée'),
        link('l1', 'a', 'b'),
      ]),
    )

    expect(mermaid).toContain('flowchart TD')
    expect(mermaid).toContain('n0["Passer commande"]')
    expect(mermaid).toContain('n1["Commande passée"]')
    expect(mermaid).toContain('n0 --> n1')
  })

  it('leaves hotspots and questions out of the diagram', () => {
    const mermaid = buildMermaidFlowchart(
      fakeEditor([
        postIt('a', 'domain-event', 'Commande passée'),
        postIt('h', 'hotspot', 'Qui valide ?'),
        postIt('q', 'question', 'Et si le stock manque ?'),
      ]),
    )

    expect(mermaid).toContain('Commande passée')
    expect(mermaid).not.toContain('Qui valide ?')
    expect(mermaid).not.toContain('Et si le stock manque ?')
  })

  it('keeps system and integration message post-its, which share their colors with the excluded kinds', () => {
    const mermaid = buildMermaidFlowchart(
      fakeEditor([postIt('s', 'system', 'Facturation'), postIt('m', 'integration-message', 'FactureÉmise')]),
    )

    expect(mermaid).toContain('Facturation')
    expect(mermaid).toContain('FactureÉmise')
  })

  it('drops links whose end is an excluded post-it, without leaving a phantom node', () => {
    const mermaid = buildMermaidFlowchart(
      fakeEditor([
        postIt('a', 'domain-event', 'Commande passée'),
        postIt('h', 'hotspot', 'Qui valide ?'),
        link('l1', 'a', 'h'),
        link('l2', 'h', 'a'),
      ]),
    )

    expect(mermaid).not.toMatch(/-->/)
    expect(mermaid.split('\n')).toEqual([
      'flowchart TD',
      '  n0["Commande passée"]',
      '  style n0 fill:#f7670733,stroke:#f76707',
    ])
  })

  it('still ignores links that are not bound at both ends', () => {
    const mermaid = buildMermaidFlowchart(
      fakeEditor([postIt('a', 'command', 'Passer commande'), unboundLink('l1', 'a')]),
    )

    expect(mermaid).not.toMatch(/-->/)
  })

  it('excludes hotspots and questions nested in a swimlane', () => {
    const mermaid = buildMermaidFlowchart(
      fakeEditor([
        swimlane('f', 'Client'),
        postIt('a', 'command', 'Passer commande', 'shape:f'),
        postIt('h', 'hotspot', 'Qui valide ?', 'shape:f'),
      ]),
    )

    expect(mermaid).toContain('subgraph n0["Client"]')
    expect(mermaid).toContain('    n1["Passer commande"]')
    expect(mermaid).not.toContain('Qui valide ?')
  })

  it('produces a valid diagram for a swimlane holding only excluded post-its', () => {
    const mermaid = buildMermaidFlowchart(
      fakeEditor([swimlane('f', 'Incertitudes'), postIt('h', 'hotspot', 'Qui valide ?', 'shape:f')]),
    )

    expect(mermaid.split('\n')).toEqual(['flowchart TD', '  subgraph n0["Incertitudes"]', '  end'])
  })

  // Ateliers créés avant le marquage du type : un post-it rouge y était forcément un point chaud,
  // un post-it vert une question.
  it('excludes unmarked red and green post-its from older workshops', () => {
    const mermaid = buildMermaidFlowchart(
      fakeEditor([
        legacyPostIt('a', 'orange', 'Commande passée'),
        legacyPostIt('h', 'red', 'Qui valide ?'),
        legacyPostIt('q', 'green', 'Et si le stock manque ?'),
      ]),
    )

    expect(mermaid).toContain('Commande passée')
    expect(mermaid).not.toContain('Qui valide ?')
    expect(mermaid).not.toContain('Et si le stock manque ?')
  })
})
