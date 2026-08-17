import { type FormEvent, type ReactNode, useState } from 'react'
import { useParticipantName } from '../hooks/useParticipantName'
import '../styles/charter.css'
import './RequireParticipantName.css'

export function RequireParticipantName({ children }: Readonly<{ children: ReactNode }>) {
  const { name, setName } = useParticipantName()
  const [draft, setDraft] = useState('')

  if (name) return <>{children}</>

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setName(draft)
  }

  return (
    <div className="participant-gate">
      <form onSubmit={handleSubmit} className="participant-gate__panel">
        <h1 className="charter-title" style={{ fontSize: 20, margin: 0 }}>
          Bienvenue
        </h1>
        <p className="participant-gate__subtitle">Indiquez votre nom pour accéder aux ateliers.</p>
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Votre nom"
          className="participant-gate__input"
        />
        <button type="submit" disabled={!draft.trim()} className="charter-button">
          Continuer
        </button>
      </form>
    </div>
  )
}
