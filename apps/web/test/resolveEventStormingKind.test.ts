import { describe, expect, it } from 'vitest'
import type { TLShape } from 'tldraw'
import { ES_KIND_META_KEY, resolveEventStormingKind } from '../src/shapes/resolveEventStormingKind'

function geoShape(props: { color: string; fill: string }, meta?: Record<string, unknown>): TLShape {
  return { id: 'shape:test', type: 'geo', props, meta: meta ?? {} } as unknown as TLShape
}

describe('resolveEventStormingKind', () => {
  it('reads the kind marked on the shape', () => {
    const shape = geoShape({ color: 'red', fill: 'solid' }, { [ES_KIND_META_KEY]: 'system' })
    expect(resolveEventStormingKind(shape)?.id).toBe('system')
  })

  it('tells apart two kinds sharing a color, thanks to the marked kind', () => {
    const system = geoShape({ color: 'red', fill: 'solid' }, { [ES_KIND_META_KEY]: 'system' })
    const hotspot = geoShape({ color: 'red', fill: 'none' }, { [ES_KIND_META_KEY]: 'hotspot' })
    expect(resolveEventStormingKind(system)?.id).toBe('system')
    expect(resolveEventStormingKind(hotspot)?.id).toBe('hotspot')
  })

  // Post-its des ateliers créés avant l'introduction du marquage : une couleur = un type, et le
  // point chaud comme la question s'y affichaient avec un fond uni.
  it('falls back to the historical color mapping for unmarked shapes', () => {
    expect(resolveEventStormingKind(geoShape({ color: 'orange', fill: 'solid' }))?.id).toBe('domain-event')
    expect(resolveEventStormingKind(geoShape({ color: 'blue', fill: 'solid' }))?.id).toBe('command')
    expect(resolveEventStormingKind(geoShape({ color: 'yellow', fill: 'solid' }))?.id).toBe('actor')
    expect(resolveEventStormingKind(geoShape({ color: 'grey', fill: 'solid' }))?.id).toBe('aggregate')
    expect(resolveEventStormingKind(geoShape({ color: 'violet', fill: 'solid' }))?.id).toBe('policy')
  })

  it('reads an unmarked red post-it as a hotspot and an unmarked green one as a question', () => {
    expect(resolveEventStormingKind(geoShape({ color: 'red', fill: 'solid' }))?.id).toBe('hotspot')
    expect(resolveEventStormingKind(geoShape({ color: 'green', fill: 'solid' }))?.id).toBe('question')
  })

  // La table historique fige la couleur que chaque type avait avant l'alignement sur le canon
  // communautaire (agrégat jaune, système/politique/message d'intégration réassignés) : elle ne
  // doit pas suivre les couleurs actuelles de `EVENT_STORMING_KINDS`, sous peine de faire résoudre
  // un vieux post-it gris vers le mauvais type.
  it('keeps resolving legacy unmarked post-its by their historical color, unaffected by current kind colors', () => {
    expect(resolveEventStormingKind(geoShape({ color: 'grey', fill: 'solid' }))?.id).toBe('aggregate')
    expect(resolveEventStormingKind(geoShape({ color: 'yellow', fill: 'solid' }))?.id).toBe('actor')
  })

  it('reads the query model kind marked on the shape, sharing green with the (unmarked-only) question fallback', () => {
    const shape = geoShape({ color: 'green', fill: 'solid' }, { [ES_KIND_META_KEY]: 'query-model' })
    expect(resolveEventStormingKind(shape)?.id).toBe('query-model')
  })

  it('falls back to the color when the marked kind is unknown', () => {
    const shape = geoShape({ color: 'orange', fill: 'solid' }, { [ES_KIND_META_KEY]: 'not-a-kind' })
    expect(resolveEventStormingKind(shape)?.id).toBe('domain-event')
  })

  it('returns undefined for shapes that are not post-its', () => {
    const arrow = { id: 'shape:arrow', type: 'arrow', props: { color: 'black' }, meta: {} } as unknown as TLShape
    const frame = { id: 'shape:frame', type: 'frame', props: { name: 'Couloir' }, meta: {} } as unknown as TLShape
    expect(resolveEventStormingKind(arrow)).toBeUndefined()
    expect(resolveEventStormingKind(frame)).toBeUndefined()
  })

  it('returns undefined for a post-it whose color matches no kind', () => {
    expect(resolveEventStormingKind(geoShape({ color: 'light-blue', fill: 'solid' }))).toBeUndefined()
  })
})
