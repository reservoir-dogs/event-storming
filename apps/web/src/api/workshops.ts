import { API_URL } from '../config'

export interface Workshop {
  id: string
  name: string
  thumbnail: string | null
  created_at: string
  updated_at: string
}

export async function fetchWorkshops(): Promise<Workshop[]> {
  const res = await fetch(`${API_URL}/api/workshops`)
  if (!res.ok) throw new Error('Impossible de charger les ateliers')
  const data = (await res.json()) as { workshops: Workshop[] }
  return data.workshops
}

export async function createWorkshop(name: string): Promise<Workshop> {
  const res = await fetch(`${API_URL}/api/workshops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error("Impossible de créer l'atelier")
  const data = (await res.json()) as { workshop: Workshop }
  return data.workshop
}

export async function fetchWorkshop(id: string): Promise<Workshop | undefined> {
  const res = await fetch(`${API_URL}/api/workshops/${id}`)
  if (res.status === 404) return undefined
  if (!res.ok) throw new Error("Impossible de charger l'atelier")
  const data = (await res.json()) as { workshop: Workshop }
  return data.workshop
}

export async function renameWorkshop(id: string, name: string): Promise<Workshop> {
  const res = await fetch(`${API_URL}/api/workshops/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error("Impossible de renommer l'atelier")
  const data = (await res.json()) as { workshop: Workshop }
  return data.workshop
}

export async function updateWorkshopThumbnail(id: string, thumbnail: string): Promise<Workshop> {
  const res = await fetch(`${API_URL}/api/workshops/${id}/thumbnail`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thumbnail }),
  })
  if (!res.ok) throw new Error("Impossible d'enregistrer l'aperçu de l'atelier")
  const data = (await res.json()) as { workshop: Workshop }
  return data.workshop
}

export async function deleteWorkshop(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/workshops/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error("Impossible de supprimer l'atelier")
}
