import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { workshopsRouter } from '../src/routes/workshops.js'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/workshops', workshopsRouter)
  return app
}

describe('PATCH /api/workshops/:id/thumbnail', () => {
  it('saves the generated board preview for an existing workshop', async () => {
    const app = buildApp()
    const created = await request(app).post('/api/workshops').send({ name: 'Atelier avec aperçu' })
    const id: string = created.body.workshop.id

    const res = await request(app)
      .patch(`/api/workshops/${id}/thumbnail`)
      .send({ thumbnail: 'data:image/png;base64,AAA' })

    expect(res.status).toBe(200)
    expect(res.body.workshop.thumbnail).toBe('data:image/png;base64,AAA')
  })

  it('returns 404 when the workshop does not exist', async () => {
    const app = buildApp()

    const res = await request(app)
      .patch('/api/workshops/does-not-exist/thumbnail')
      .send({ thumbnail: 'data:image/png;base64,AAA' })

    expect(res.status).toBe(404)
  })

  it('returns 400 when the thumbnail is missing', async () => {
    const app = buildApp()
    const created = await request(app).post('/api/workshops').send({ name: 'Atelier sans aperçu envoyé' })
    const id: string = created.body.workshop.id

    const res = await request(app).patch(`/api/workshops/${id}/thumbnail`).send({})

    expect(res.status).toBe(400)
  })
})
