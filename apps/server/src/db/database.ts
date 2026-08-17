import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const DB_PATH = process.env.DB_PATH ?? './data/event-storming.sqlite'

mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS workshops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    thumbnail TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workshop_snapshots (
    workshop_id TEXT PRIMARY KEY REFERENCES workshops(id) ON DELETE CASCADE,
    snapshot TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

// `CREATE TABLE IF NOT EXISTS` above only applies to brand new databases: existing
// `event-storming.sqlite` files predating the thumbnail feature need the column added explicitly.
const workshopColumns = db.prepare('PRAGMA table_info(workshops)').all() as { name: string }[]
if (!workshopColumns.some((column) => column.name === 'thumbnail')) {
  db.exec('ALTER TABLE workshops ADD COLUMN thumbnail TEXT')
}

export interface Workshop {
  id: string
  name: string
  thumbnail: string | null
  created_at: string
  updated_at: string
}

export function listWorkshops(): Workshop[] {
  return db.prepare('SELECT * FROM workshops ORDER BY updated_at DESC').all() as Workshop[]
}

export function getWorkshop(id: string): Workshop | undefined {
  return db.prepare('SELECT * FROM workshops WHERE id = ?').get(id) as Workshop | undefined
}

export function createWorkshop(id: string, name: string): Workshop {
  const now = new Date().toISOString()
  db.prepare('INSERT INTO workshops (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
    id,
    name,
    now,
    now,
  )
  return { id, name, thumbnail: null, created_at: now, updated_at: now }
}

export function touchWorkshop(id: string): void {
  db.prepare('UPDATE workshops SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), id)
}

export function updateWorkshopThumbnail(id: string, thumbnail: string): Workshop | undefined {
  const result = db.prepare('UPDATE workshops SET thumbnail = ? WHERE id = ?').run(thumbnail, id)
  if (result.changes === 0) return undefined
  return getWorkshop(id)
}

export function renameWorkshop(id: string, name: string): Workshop | undefined {
  const now = new Date().toISOString()
  const result = db
    .prepare('UPDATE workshops SET name = ?, updated_at = ? WHERE id = ?')
    .run(name, now, id)
  if (result.changes === 0) return undefined
  return getWorkshop(id)
}

export function deleteWorkshop(id: string): boolean {
  db.prepare('DELETE FROM workshop_snapshots WHERE workshop_id = ?').run(id)
  const result = db.prepare('DELETE FROM workshops WHERE id = ?').run(id)
  return result.changes > 0
}

export function loadSnapshot(workshopId: string): string | undefined {
  const row = db
    .prepare('SELECT snapshot FROM workshop_snapshots WHERE workshop_id = ?')
    .get(workshopId) as { snapshot: string } | undefined
  return row?.snapshot
}

export function saveSnapshot(workshopId: string, snapshot: string): void {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO workshop_snapshots (workshop_id, snapshot, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(workshop_id) DO UPDATE SET snapshot = excluded.snapshot, updated_at = excluded.updated_at`,
  ).run(workshopId, snapshot, now)
  touchWorkshop(workshopId)
}
