import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { publishThumbnailUpdate } from '../src/api/thumbnailUpdates'
import { HomePage } from '../src/pages/HomePage'

describe('HomePage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (!init || init.method === undefined) {
          return new Response(JSON.stringify({ workshops: [] }), { status: 200 })
        }
        if (init.method === 'POST') {
          return new Response(
            JSON.stringify({
              workshop: { id: 'wNewWorkshop123', name: 'Mon atelier', created_at: '', updated_at: '' },
            }),
            { status: 201 },
          )
        }
        return new Response('not found', { status: 404 })
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows an empty state when there are no workshops yet', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/aucun atelier pour le moment/i)).toBeInTheDocument()
    })
  })

  it('shows each workshop as a card with its name above the board preview or a placeholder', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            workshops: [
              {
                id: 'wWithThumb00000000000000',
                name: 'Atelier avec aperçu',
                thumbnail: 'data:image/png;base64,AAA',
                created_at: '',
                updated_at: '',
              },
              {
                id: 'wNoThumb000000000000000',
                name: 'Atelier sans aperçu',
                thumbnail: null,
                created_at: '',
                updated_at: '',
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    )

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Atelier avec aperçu')).toBeInTheDocument()
    })

    const withThumbLink = screen.getByRole('link', { name: /atelier avec aperçu/i })
    expect(withThumbLink).toHaveAttribute('href', '/atelier/wWithThumb00000000000000')
    expect(withThumbLink.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,AAA')

    const withoutThumbLink = screen.getByRole('link', { name: /atelier sans aperçu/i })
    expect(withoutThumbLink).toHaveAttribute('href', '/atelier/wNoThumb000000000000000')
    expect(withoutThumbLink.querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByText(/aucun aperçu disponible/i)).toBeInTheDocument()
  })

  it('truncates a very long workshop name visually while keeping it available via the title attribute', async () => {
    const longName = 'Un atelier avec un nom vraiment très long qui devrait déborder de la vignette'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            workshops: [
              { id: 'wLongName00000000000000', name: longName, thumbnail: null, created_at: '', updated_at: '' },
            ],
          }),
          { status: 200 },
        ),
      ),
    )

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTitle(longName)).toBeInTheDocument()
    })
  })

  it('reflects a thumbnail generated just after leaving a workshop, without needing a page reload', async () => {
    // Reproduit le bug : le serveur renvoie encore l'ancienne valeur (pas d'aperçu) car la
    // requête PATCH déclenchée en quittant l'atelier n'a pas eu le temps d'aboutir, mais le
    // client a déjà généré et diffusé l'aperçu localement (voir `thumbnailUpdates.ts`).
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            workshops: [
              {
                id: 'wRaceCondition00000000000',
                name: 'Atelier tout juste quitté',
                thumbnail: null,
                created_at: '',
                updated_at: '',
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    )

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/aucun aperçu disponible/i)).toBeInTheDocument()
    })

    publishThumbnailUpdate('wRaceCondition00000000000', 'data:image/png;base64,FRESH')

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /atelier tout juste quitté/i })
      expect(link.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,FRESH')
    })
  })

  it('lets a business expert create a new blank workshop by name', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await waitFor(() => screen.getByPlaceholderText(/nom de l'atelier/i))

    await user.type(screen.getByPlaceholderText(/nom de l'atelier/i), 'Onboarding client')
    await user.click(screen.getByRole('button', { name: /créer un atelier/i }))

    await waitFor(() => {
      const postCall = vi
        .mocked(fetch)
        .mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST')
      expect(postCall).toBeTruthy()
      expect(JSON.parse((postCall![1] as RequestInit).body as string)).toEqual({
        name: 'Onboarding client',
      })
    })
  })
})
