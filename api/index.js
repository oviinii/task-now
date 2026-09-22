// Entrypoint serverless p/ Vercel (vercel.json reescreve /api/* → esta função).
// Monta o router em /api E em / para tolerar ambos os formatos de req.url.
import express from 'express'
import cors from 'cors'
import { createApiRouter } from '../server/routes.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
const router = createApiRouter()
app.use('/api', router)
app.use('/', router)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('API error:', err)
  res.status(500).json({ error: 'Erro interno' })
})

export default app
