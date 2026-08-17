import { NodeSqliteWrapper, SQLiteSyncStorage, TLSocketRoom } from '@tldraw/sync-core'
import { createTLSchema } from '@tldraw/tlschema'
import { db, touchWorkshop } from '../db/database.js'

const schema = createTLSchema()
const rooms = new Map<string, TLSocketRoom>()

/**
 * Reused as an unquoted SQL table-name prefix below, so only ids matching this shape
 * (as produced by generateWorkshopId in routes/workshops.ts) are ever allowed through.
 */
const SAFE_WORKSHOP_ID = /^[A-Za-z][A-Za-z0-9]*$/

export function getOrCreateRoom(workshopId: string): TLSocketRoom {
  if (!SAFE_WORKSHOP_ID.test(workshopId)) {
    throw new Error(`Invalid workshop id: ${workshopId}`)
  }

  const existing = rooms.get(workshopId)
  if (existing && !existing.isClosed()) return existing

  const sql = new NodeSqliteWrapper(db, { tablePrefix: `room_${workshopId}_` })
  const storage = new SQLiteSyncStorage({
    sql,
    onChange: () => touchWorkshop(workshopId),
  })

  const room = new TLSocketRoom({
    schema,
    storage,
    onSessionRemoved: (r, { numSessionsRemaining }) => {
      if (numSessionsRemaining === 0) {
        rooms.delete(workshopId)
      }
    },
  })
  rooms.set(workshopId, room)
  return room
}

// Ferme la room en mémoire (déconnecte les participants encore présents) et supprime les
// tables SQL dédiées créées par `SQLiteSyncStorage` pour cet atelier (`room_<id>_documents`,
// `_tombstones`, `_metadata`) — ces tables ne sont pas couvertes par le schéma déclaratif de
// `database.ts` puisqu'elles sont créées dynamiquement, à la première connexion, par
// `getOrCreateRoom`.
export function deleteRoomData(workshopId: string): void {
  if (!SAFE_WORKSHOP_ID.test(workshopId)) {
    throw new Error(`Invalid workshop id: ${workshopId}`)
  }

  const existing = rooms.get(workshopId)
  if (existing) {
    existing.close()
    rooms.delete(workshopId)
  }

  const prefix = `room_${workshopId}_`
  db.exec(`
    DROP TABLE IF EXISTS ${prefix}documents;
    DROP TABLE IF EXISTS ${prefix}tombstones;
    DROP TABLE IF EXISTS ${prefix}metadata;
  `)
}
