import { describe, expect, it } from 'vitest'
import { EVENT_STORMING_KINDS, KIND_COLOR_HEX } from '../src/shapes/eventStormingKinds'

describe('event storming element kinds', () => {
  it('defines the standard event storming element types', () => {
    const ids = EVENT_STORMING_KINDS.map((kind) => kind.id)
    expect(ids).toEqual([
      'domain-event',
      'command',
      'actor',
      'aggregate',
      'policy',
      'system',
      'integration-message',
      'hotspot',
      'question',
    ])
  })

  // Deux types partagent une couleur (système/point chaud en rouge, message d'intégration/question
  // en vert) : c'est le couple couleur + intensité de fond qui doit rester unique par type.
  it('gives every kind a visually distinct color and fill emphasis combination', () => {
    const appearances = EVENT_STORMING_KINDS.map((kind) => `${kind.color}/${kind.fillEmphasis}`)
    expect(new Set(appearances).size).toBe(appearances.length)
  })

  it('renders the domain event kind in orange, per the canvas spec scenario', () => {
    const domainEvent = EVENT_STORMING_KINDS.find((kind) => kind.id === 'domain-event')
    expect(domainEvent?.color).toBe('orange')
  })

  it('renders the system kind in red with a tinted fill', () => {
    const system = EVENT_STORMING_KINDS.find((kind) => kind.id === 'system')
    expect(system).toMatchObject({ color: 'red', fillEmphasis: 'tinted' })
  })

  it('renders the integration message kind in green with a tinted fill', () => {
    const integrationMessage = EVENT_STORMING_KINDS.find((kind) => kind.id === 'integration-message')
    expect(integrationMessage).toMatchObject({ color: 'green', fillEmphasis: 'tinted' })
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
