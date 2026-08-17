import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { getOrCreateRoom } from '../src/sync/roomManager.js'
import { workshopsRouter } from '../src/routes/workshops.js'

const SAFE_WORKSHOP_ID = /^[A-Za-z][A-Za-z0-9]*$/

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/workshops', workshopsRouter)
  return app
}

describe('generated workshop ids', () => {
  it('always start with a letter, across many draws, so they are always a valid SQL table-name prefix', async () => {
    const app = buildApp()

    for (let i = 0; i < 200; i++) {
      const res = await request(app).post('/api/workshops').send({ name: `Atelier ${i}` })
      expect(res.status).toBe(201)
      const id: string = res.body.workshop.id
      expect(id).toMatch(SAFE_WORKSHOP_ID)
      // Would throw if the id were ever rejected by the sync layer's own safety check.
      expect(() => getOrCreateRoom(id)).not.toThrow()
    }
  })
})
