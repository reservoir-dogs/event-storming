import { describe, expect, it } from 'vitest'
import { EVENT_STORMING_KINDS, KIND_COLOR_HEX, MERMAID_EXCLUDED_KIND_IDS } from '../src/shapes/eventStormingKinds'

describe('event storming element kinds', () => {
  // Ordre d'affichage dans la toolbar : l'acteur ouvre la liste (juste après l'outil de sélection,
  // hors `EVENT_STORMING_KINDS`), et le query model suit directement la commande, comme pendant en
  // lecture du couple commande/domain event en écriture.
  it('defines the standard event storming element types, in toolbar display order', () => {
    const ids = EVENT_STORMING_KINDS.map((kind) => kind.id)
    expect(ids).toEqual([
      'actor',
      'domain-event',
      'command',
      'query-model',
      'aggregate',
      'policy',
      'system',
      'integration-message',
      'hotspot',
      'question',
    ])
  })

  it('gives every kind an English label', () => {
    const labels = EVENT_STORMING_KINDS.map((kind) => kind.label)
    expect(labels).toEqual([
      'Actor',
      'Domain Event',
      'Command',
      'Query Model',
      'Aggregate',
      'Policy',
      'System',
      'Integration Message',
      'Hotspot',
      'Question',
    ])
  })

  // Trois couleurs sont partagées par deux types : rouge (système/point chaud), vert (message
  // d'intégration/question) et jaune (acteur/agrégat) — c'est le couple couleur + intensité de fond
  // qui doit rester unique par type, à la seule exception documentée acteur/agrégat, qui partagent
  // aussi l'intensité et ne se distinguent que par leur taille (voir `size`).
  it('gives every kind a visually distinct color and fill emphasis combination, except actor/aggregate which share both and are told apart by size', () => {
    const appearances = EVENT_STORMING_KINDS.filter((kind) => kind.id !== 'aggregate').map(
      (kind) => `${kind.color}/${kind.fillEmphasis}`,
    )
    expect(new Set(appearances).size).toBe(appearances.length)

    const actor = EVENT_STORMING_KINDS.find((kind) => kind.id === 'actor')
    const aggregate = EVENT_STORMING_KINDS.find((kind) => kind.id === 'aggregate')
    expect(`${aggregate?.color}/${aggregate?.fillEmphasis}`).toBe(`${actor?.color}/${actor?.fillEmphasis}`)
  })

  it('renders the domain event kind in orange, per the canvas spec scenario', () => {
    const domainEvent = EVENT_STORMING_KINDS.find((kind) => kind.id === 'domain-event')
    expect(domainEvent?.color).toBe('orange')
  })

  it('renders the aggregate kind in yellow with a tinted fill, same as the actor', () => {
    const aggregate = EVENT_STORMING_KINDS.find((kind) => kind.id === 'aggregate')
    expect(aggregate).toMatchObject({ color: 'yellow', fillEmphasis: 'tinted' })
  })

  it('renders the policy kind in light-violet with a tinted fill', () => {
    const policy = EVENT_STORMING_KINDS.find((kind) => kind.id === 'policy')
    expect(policy).toMatchObject({ color: 'light-violet', fillEmphasis: 'tinted' })
  })

  it('renders the system kind in light-red with a tinted fill', () => {
    const system = EVENT_STORMING_KINDS.find((kind) => kind.id === 'system')
    expect(system).toMatchObject({ color: 'light-red', fillEmphasis: 'tinted' })
  })

  it('renders the integration message kind in grey with a tinted fill', () => {
    const integrationMessage = EVENT_STORMING_KINDS.find((kind) => kind.id === 'integration-message')
    expect(integrationMessage).toMatchObject({ color: 'grey', fillEmphasis: 'tinted' })
  })

  it('renders the query model kind in green with a tinted fill, and includes it in mermaid exports', () => {
    const queryModel = EVENT_STORMING_KINDS.find((kind) => kind.id === 'query-model')
    expect(queryModel).toMatchObject({ color: 'green', fillEmphasis: 'tinted' })
    expect(MERMAID_EXCLUDED_KIND_IDS).not.toContain('query-model')
  })

  it('gives the actor a smaller fixed size than the standard, and leaves other kinds without one', () => {
    const actor = EVENT_STORMING_KINDS.find((kind) => kind.id === 'actor')
    expect(actor?.size).toEqual({ w: 160, h: 160 })

    const others = EVENT_STORMING_KINDS.filter((kind) => kind.id !== 'actor')
    expect(others.every((kind) => kind.size === undefined)).toBe(true)
  })

  it('gives a strong fill to the hotspot and question kinds only, keeping their colors', () => {
    const strongKinds = EVENT_STORMING_KINDS.filter((kind) => kind.fillEmphasis === 'strong')
    expect(strongKinds.map((kind) => kind.id)).toEqual(['hotspot', 'question'])
    expect(strongKinds.map((kind) => kind.color)).toEqual(['red', 'green'])
  })

  it('binds the hotspot kind to the H key', () => {
    const hotspot = EVENT_STORMING_KINDS.find((kind) => kind.id === 'hotspot')
    expect(hotspot?.shortcutKey).toBe('h')
  })

  it('gives every kind a distinct, single-letter shortcut key', () => {
    const shortcutKeys = EVENT_STORMING_KINDS.map((kind) => kind.shortcutKey)
    expect(new Set(shortcutKeys).size).toBe(shortcutKeys.length)
    for (const key of shortcutKeys) {
      expect(key).toMatch(/^[a-z]$/)
    }
  })

  it('maps every kind color to a hex value', () => {
    for (const kind of EVENT_STORMING_KINDS) {
      expect(KIND_COLOR_HEX[kind.color]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
