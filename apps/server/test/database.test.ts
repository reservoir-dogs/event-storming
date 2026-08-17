import { describe, expect, it } from 'vitest'
import {
  createWorkshop,
  deleteWorkshop,
  getWorkshop,
  listWorkshops,
  renameWorkshop,
  touchWorkshop,
} from '../src/db/database.js'

describe('workshop metadata store', () => {
  it('creates a workshop and retrieves it by id', () => {
    const created = createWorkshop('wabc123', 'Atelier onboarding client')
    const found = getWorkshop('wabc123')

    expect(found).toEqual(created)
    expect(found?.name).toBe('Atelier onboarding client')
  })

  it('returns undefined for an unknown workshop id', () => {
    expect(getWorkshop('does-not-exist')).toBeUndefined()
  })

  it('lists workshops ordered by most recently updated first', () => {
    createWorkshop('wfirst00000000000000000', 'Premier atelier')
    createWorkshop('wsecond0000000000000000', 'Second atelier')
    touchWorkshop('wfirst00000000000000000')

    const [mostRecent] = listWorkshops()
    expect(mostRecent.id).toBe('wfirst00000000000000000')
  })

  it('renames an existing workshop', () => {
    createWorkshop('wrename000000000000000', 'Ancien nom')

    const renamed = renameWorkshop('wrename000000000000000', 'Nouveau nom')

    expect(renamed?.name).toBe('Nouveau nom')
    expect(getWorkshop('wrename000000000000000')?.name).toBe('Nouveau nom')
  })

  it('returns undefined when renaming an unknown workshop', () => {
    expect(renameWorkshop('does-not-exist', 'Nouveau nom')).toBeUndefined()
  })

  it('deletes an existing workshop', () => {
    createWorkshop('wdelete0000000000000000', 'À supprimer')

    expect(deleteWorkshop('wdelete0000000000000000')).toBe(true)
    expect(getWorkshop('wdelete0000000000000000')).toBeUndefined()
  })

  it('returns false when deleting an unknown workshop', () => {
    expect(deleteWorkshop('does-not-exist')).toBe(false)
  })
})
