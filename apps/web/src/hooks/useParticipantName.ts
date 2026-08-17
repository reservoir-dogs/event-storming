import { useCallback, useState } from 'react'

const STORAGE_KEY = 'event-storming:participant-name'

export function useParticipantName(): {
  name: string | null
  setName: (value: string) => void
} {
  const [name, setNameState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))

  const setName = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setNameState(trimmed)
  }, [])

  return { name, setName }
}
