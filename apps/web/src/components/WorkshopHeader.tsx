import { type FormEvent, useState } from 'react'
import { renameWorkshop, type Workshop } from '../api/workshops'

export function WorkshopHeader({
  workshop,
  onRenamed,
}: Readonly<{
  workshop: Workshop | null
  onRenamed: (name: string) => void
}>) {
  const [editingName, setEditingName] = useState<string | null>(null)

  if (!workshop) return null

  async function handleRenameSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = editingName?.trim()
    setEditingName(null)
    if (!trimmed || !workshop || trimmed === workshop.name) return
    const updated = await renameWorkshop(workshop.id, trimmed)
    onRenamed(updated.name)
  }

  return (
    <div
      style={{
        pointerEvents: 'all',
        position: 'absolute',
        // Décalé sous la barre d'outils native de tldraw : depuis le retrait du lien de retour et
        // du bouton "Copier le lien", cet en-tête ne contient plus que le titre, dont la position
        // se retrouvait exactement sous le bouton natif "People" (avatars des participants) que
        // tldraw affiche en haut à droite dès qu'il y a plusieurs participants connectés.
        top: 56,
        right: 8,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        fontSize: 12,
      }}
    >
      {editingName === null ? (
        <span
          title="Renommer l'atelier"
          onClick={() => setEditingName(workshop.name)}
          style={{ cursor: 'text', fontWeight: 600 }}
        >
          {workshop.name}
        </span>
      ) : (
        <form onSubmit={handleRenameSubmit}>
          <input
            autoFocus
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
            onBlur={handleRenameSubmit}
            style={{ fontSize: 12, padding: '2px 4px' }}
          />
        </form>
      )}
    </div>
  )
}
