import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLatestThumbnail, subscribeToThumbnailUpdates } from '../api/thumbnailUpdates'
import { createWorkshop, fetchWorkshops, type Workshop } from '../api/workshops'
import { WorkshopCard } from '../components/WorkshopCard'
import '../styles/charter.css'

function withLatestThumbnail(workshop: Workshop): Workshop {
  return { ...workshop, thumbnail: getLatestThumbnail(workshop.id) ?? workshop.thumbnail }
}

function replaceThumbnail(workshops: Workshop[], workshopId: string, thumbnail: string): Workshop[] {
  return workshops.map((workshop) => (workshop.id === workshopId ? { ...workshop, thumbnail } : workshop))
}

export function HomePage() {
  const navigate = useNavigate()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkshops()
      .then((list) => setWorkshops(list.map(withLatestThumbnail)))
      .catch(() => setError('Impossible de charger les ateliers.'))
  }, [])

  useEffect(() => {
    // Un atelier quitté juste après une modification peut avoir un aperçu plus récent côté
    // client que ce que le serveur a déjà persisté (voir `thumbnailUpdates.ts`) : on l'applique
    // dès qu'il arrive, sans attendre un rechargement de la page.
    return subscribeToThumbnailUpdates((workshopId, thumbnail) => {
      setWorkshops((current) => replaceThumbnail(current, workshopId, thumbnail))
    })
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setCreating(true)
    setError(null)
    try {
      const workshop = await createWorkshop(trimmed)
      navigate(`/atelier/${workshop.id}`)
    } catch {
      setError("Impossible de créer l'atelier.")
      setCreating(false)
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 className="charter-title">Ateliers d'event storming</h1>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom de l'atelier"
          style={{ flex: 1, padding: 8, fontSize: 14 }}
        />
        <button type="submit" disabled={creating || !name.trim()} className="charter-button">
          Créer un atelier
        </button>
      </form>

      {error && <p style={{ color: '#e03131' }}>{error}</p>}

      {workshops.length === 0 ? (
        <p>Aucun atelier pour le moment. Créez-en un pour commencer.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {workshops.map((workshop) => (
            <WorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>
      )}
    </div>
  )
}
