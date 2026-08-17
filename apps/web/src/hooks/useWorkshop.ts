import { useEffect, useState } from 'react'
import { fetchWorkshop, type Workshop } from '../api/workshops'

export type WorkshopLookupStatus = 'loading' | 'found' | 'not-found'

export function useWorkshop(id: string | undefined): {
  workshop: Workshop | null
  status: WorkshopLookupStatus
} {
  const [workshop, setWorkshop] = useState<Workshop | null>(null)
  const [status, setStatus] = useState<WorkshopLookupStatus>('loading')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setStatus('loading')
    fetchWorkshop(id).then((found) => {
      if (cancelled) return
      setWorkshop(found ?? null)
      setStatus(found ? 'found' : 'not-found')
    })
    return () => {
      cancelled = true
    }
  }, [id])

  return { workshop, status }
}
