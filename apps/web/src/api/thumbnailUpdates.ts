// L'aperçu généré côté client (WorkshopPage) met un certain temps à être rendu puis persisté
// côté serveur ; si l'utilisateur quitte l'atelier entretemps, `HomePage` peut recharger la liste
// avant que le serveur ait la nouvelle valeur (l'aperçu resterait alors périmé jusqu'à un F5).
// Ce module diffuse l'aperçu dès qu'il est généré côté client, indépendamment de la persistance
// serveur, pour que la page d'accueil l'affiche immédiatement.
type ThumbnailListener = (workshopId: string, thumbnail: string) => void

const latestThumbnails = new Map<string, string>()
const listeners = new Set<ThumbnailListener>()

export function publishThumbnailUpdate(workshopId: string, thumbnail: string): void {
  latestThumbnails.set(workshopId, thumbnail)
  listeners.forEach((listener) => listener(workshopId, thumbnail))
}

export function getLatestThumbnail(workshopId: string): string | undefined {
  return latestThumbnails.get(workshopId)
}

export function subscribeToThumbnailUpdates(listener: ThumbnailListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
