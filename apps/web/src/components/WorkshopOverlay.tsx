import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useWorkshop } from '../hooks/useWorkshop'
import { ParticipantsPanel } from './ParticipantsPanel'
import { Timeline } from './Timeline'
import { WorkshopHeader } from './WorkshopHeader'

export function WorkshopOverlay() {
  const { id } = useParams<{ id: string }>()
  const { workshop } = useWorkshop(id)
  const [renamedTo, setRenamedTo] = useState<string | null>(null)

  const displayedWorkshop = workshop && renamedTo ? { ...workshop, name: renamedTo } : workshop

  return (
    <>
      <Timeline />
      <ParticipantsPanel />
      <WorkshopHeader workshop={displayedWorkshop ?? null} onRenamed={setRenamedTo} />
    </>
  )
}
