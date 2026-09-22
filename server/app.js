// App Express p/ desenvolvimento local (montado em /api; Vite faz proxy).
import express from 'express'
import cors from 'cors'
import { createApiRouter } from './routes.js'

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', createApiRouter())
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('API error:', err)
    res.status(500).json({ error: 'Erro interno' })
  })
  return app
}
