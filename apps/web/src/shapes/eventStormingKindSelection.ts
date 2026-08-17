import { atom } from 'tldraw'
import { EVENT_STORMING_KINDS, type EventStormingKind } from './eventStormingKinds'

// Type de post-it actuellement armé dans la barre d'outils. Il ne peut pas être déduit des styles
// du prochain shape (`getStyleForNextShape`) : deux types partagent une même couleur, seul le type
// lui-même les distingue. C'est un `atom` et non une simple variable de module pour que la barre
// d'outils (`track`) se réaffiche quand le type armé change, d'où qu'il vienne (clic, raccourci
// clavier, glisser-déposer).
const selectedKind = atom<EventStormingKind>('eventStormingSelectedKind', EVENT_STORMING_KINDS[0])

export function setSelectedKind(kind: EventStormingKind) {
  selectedKind.set(kind)
}

export function getSelectedKind(): EventStormingKind {
  return selectedKind.get()
}
