import { Router } from 'express'
import { customAlphabet } from 'nanoid'
import {
  createWorkshop,
  deleteWorkshop,
  getWorkshop,
  listWorkshops,
  renameWorkshop,
  updateWorkshopThumbnail,
} from '../db/database.js'
import { deleteRoomData } from '../sync/roomManager.js'

// Alphanumeric only (no '-'/'_'): the id is reused as a SQL table-name prefix by the
// sync storage layer, which interpolates it unquoted, and hyphens break that identifier.
// A fixed leading letter guarantees the id is always a valid unquoted SQL identifier
// (customAlphabet alone could still produce a leading digit). 23 random chars from a
// 62-character alphabet is ~137 bits of entropy, well above what's needed for an
// unguessable share link.
const randomIdSuffix = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  23,
)
const generateWorkshopId = () => `w${randomIdSuffix()}`

export const workshopsRouter = Router()

workshopsRouter.get('/', (_req, res) => {
  res.json({ workshops: listWorkshops() })
})

workshopsRouter.post('/', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  const id = generateWorkshopId()
  const workshop = createWorkshop(id, name)
  res.status(201).json({ workshop })
})

workshopsRouter.get('/:id', (req, res) => {
  const workshop = getWorkshop(req.params.id)
  if (!workshop) {
    res.status(404).json({ error: 'workshop not found' })
    return
  }
  res.json({ workshop })
})

workshopsRouter.patch('/:id', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  const workshop = renameWorkshop(req.params.id, name)
  if (!workshop) {
    res.status(404).json({ error: 'workshop not found' })
    return
  }
  res.json({ workshop })
})

workshopsRouter.patch('/:id/thumbnail', (req, res) => {
  const thumbnail = typeof req.body?.thumbnail === 'string' ? req.body.thumbnail : ''
  if (!thumbnail) {
    res.status(400).json({ error: 'thumbnail is required' })
    return
  }

  const workshop = updateWorkshopThumbnail(req.params.id, thumbnail)
  if (!workshop) {
    res.status(404).json({ error: 'workshop not found' })
    return
  }
  res.json({ workshop })
})

workshopsRouter.delete('/:id', (req, res) => {
  const deleted = deleteWorkshop(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'workshop not found' })
    return
  }
  deleteRoomData(req.params.id)
  res.status(204).end()
})
