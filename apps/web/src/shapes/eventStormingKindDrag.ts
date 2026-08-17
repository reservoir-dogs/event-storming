import { kindById, type EventStormingKind } from './eventStormingKinds'

// Type MIME propre à l'application : il permet de reconnaître un glissé venant de la barre d'outils
// et de ne jamais réagir aux autres contenus déposés sur le canvas (image, texte, fichier), que
// tldraw gère nativement.
const KIND_DRAG_MIME = 'application/x-event-storming-kind'

// Attribut posé sur la barre d'outils pour que le dépôt d'un type relâché sur la barre elle-même
// soit ignoré : ce geste abandonné ne doit pas créer un post-it caché derrière la barre.
export const TOOLBAR_DROP_GUARD_ATTRIBUTE = 'data-es-toolbar'

export function isDropOnToolbar(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(`[${TOOLBAR_DROP_GUARD_ATTRIBUTE}]`) !== null
}

export function setDraggedKind(dataTransfer: DataTransfer, kind: EventStormingKind) {
  dataTransfer.setData(KIND_DRAG_MIME, kind.id)
  dataTransfer.effectAllowed = 'copy'
}

// Pendant un survol de dépôt (`dragover`), les navigateurs interdisent la lecture des données du
// glissé : seule la liste des types est disponible. C'est suffisant pour décider d'accepter le dépôt.
export function isKindDrag(dataTransfer: DataTransfer | null): boolean {
  return dataTransfer?.types.includes(KIND_DRAG_MIME) ?? false
}

export function getDraggedKind(dataTransfer: DataTransfer | null): EventStormingKind | undefined {
  const kindId = dataTransfer?.getData(KIND_DRAG_MIME)
  return kindId ? kindById(kindId) : undefined
}
