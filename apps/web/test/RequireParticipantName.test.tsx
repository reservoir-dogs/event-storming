import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { RequireParticipantName } from '../src/components/RequireParticipantName'

const STORAGE_KEY = 'event-storming:participant-name'

describe('RequireParticipantName', () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY)
  })

  it('blocks access and asks for a name when none is registered yet', () => {
    render(
      <RequireParticipantName>
        <p>Contenu protégé</p>
      </RequireParticipantName>,
    )

    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/votre nom/i)).toBeInTheDocument()
  })

  it('unlocks access and persists the name once submitted', async () => {
    const user = userEvent.setup()
    render(
      <RequireParticipantName>
        <p>Contenu protégé</p>
      </RequireParticipantName>,
    )

    await user.type(screen.getByPlaceholderText(/votre nom/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /continuer/i }))

    await waitFor(() => {
      expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBe('Alice')
  })

  it('grants direct access on a later visit when a name is already stored', () => {
    localStorage.setItem(STORAGE_KEY, 'Bob')

    render(
      <RequireParticipantName>
        <p>Contenu protégé</p>
      </RequireParticipantName>,
    )

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
  })
})
