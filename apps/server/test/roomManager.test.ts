import { describe, expect, it } from 'vitest'
import { deleteRoomData, getOrCreateRoom } from '../src/sync/roomManager.js'

describe('room manager', () => {
  it('rejects workshop ids that are not safe SQL table-prefix candidates', () => {
    expect(() => getOrCreateRoom('has-a-hyphen')).toThrow()
    expect(() => getOrCreateRoom('1startsWithDigit')).toThrow()
    expect(() => getOrCreateRoom("'; DROP TABLE workshops; --")).toThrow()
  })

  it('creates a socket room for a valid workshop id and reuses it on subsequent calls', () => {
    const room = getOrCreateRoom('wValidId1234')
    expect(room.isClosed()).toBe(false)
    expect(getOrCreateRoom('wValidId1234')).toBe(room)
  })

  it('closes an active room and lets a later call re-create a fresh one', () => {
    const room = getOrCreateRoom('wToDelete123')
    deleteRoomData('wToDelete123')
    expect(room.isClosed()).toBe(true)
    expect(getOrCreateRoom('wToDelete123')).not.toBe(room)
  })

  it('rejects unsafe workshop ids', () => {
    expect(() => deleteRoomData('has-a-hyphen')).toThrow()
  })

  it('is a no-op for a workshop id that was never opened', () => {
    expect(() => deleteRoomData('wNeverOpened1')).not.toThrow()
  })
})
