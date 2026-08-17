import type { TLShape } from 'tldraw'
import { kindById, type EventStormingKind } from './eventStormingKinds'

// Clé de `shape.meta` portant le type d'event storming d'un post-it. Le type ne peut pas être
// déduit de la seule couleur depuis que le rouge est partagé par « Système » et « Point chaud », et
// le vert par « Message d'intégration » et « Question » : il est donc estampé sur le shape à sa
// création (voir `getInitialMetaForShape` dans `WorkshopPage`).
export const ES_KIND_META_KEY = 'esKind'

// Les post-its créés avant l'introduction de `meta.esKind` n'ont aucun marquage : à cette époque,
// une couleur correspondait à un seul type, y compris pour le point chaud (rouge) et la question
// (vert), tous alors rendus avec un fond uni. Leur couleur suffit donc à retrouver leur type, et
// c'est la seule situation où ce repli s'applique — tout post-it créé depuis porte son type.
const LEGACY_KIND_ID_BY_COLOR: Record<string, string> = {
  orange: 'domain-event',
  blue: 'command',
  yellow: 'actor',
  grey: 'aggregate',
  violet: 'policy',
  red: 'hotspot',
  green: 'question',
}

// Renvoie le type d'event storming d'un post-it, ou `undefined` si le shape n'est pas un post-it
// (flèche, couloir de nage) ou si son apparence ne correspond à aucun type connu.
export function resolveEventStormingKind(shape: TLShape): EventStormingKind | undefined {
  if (shape.type !== 'geo') return undefined

  const markedKindId = shape.meta?.[ES_KIND_META_KEY]
  if (typeof markedKindId === 'string') {
    const marked = kindById(markedKindId)
    if (marked) return marked
  }

  const { color } = shape.props as { color?: string }
  const legacyKindId = color ? LEGACY_KIND_ID_BY_COLOR[color] : undefined
  return legacyKindId ? kindById(legacyKindId) : undefined
}
