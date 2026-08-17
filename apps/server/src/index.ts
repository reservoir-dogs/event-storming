import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { WebSocketServer } from 'ws'
import { getWorkshop } from './db/database.js'
import { workshopsRouter } from './routes/workshops.js'
import { getOrCreateRoom } from './sync/roomManager.js'

const PORT = Number(process.env.PORT ?? 4000)
const CONNECT_PATH = /^\/connect\/([A-Za-z0-9]+)$/

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/workshops', workshopsRouter)
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const httpServer = createServer(app)
const wss = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url ?? '', 'http://localhost')
  const match = url.pathname.match(CONNECT_PATH)
  const workshopId = match?.[1]

  if (!workshopId || !getWorkshop(workshopId)) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    socket.destroy()
    return
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    try {
      const sessionId = url.searchParams.get('sessionId') ?? randomUUID()
      const room = getOrCreateRoom(workshopId)
      room.handleSocketConnect({ sessionId, socket: ws })
    } catch (error) {
      console.error(`Failed to connect workshop ${workshopId}:`, error)
      ws.close(1011, 'Internal error')
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`event-storming server listening on http://localhost:${PORT}`)
})
