import cors from 'cors'
import express from 'express'
import { initSchema, getDbPath, loadCrmState } from './db.js'
import { ensureUsers, seedDemoData, DEMO_CREDENTIALS } from './seed.js'
import { authRouter } from './routes/auth.js'
import { apiRouter, getPublishedOrder } from './routes/api.js'
import { optionalAuth } from './auth.js'
import { param } from './params.js'

const PORT = Number(process.env.PORT || 8787)

initSchema()
ensureUsers()
seedDemoData(false)

const app = express()
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    db: getDbPath(),
    time: new Date().toISOString(),
  })
})

app.use('/api/auth', authRouter)

// Public commercial proposal for published orders
app.get('/api/public/proposals/:id', optionalAuth, (req, res) => {
  const data = getPublishedOrder(param(req, 'id'))
  if (!data) {
    res.status(404).json({ error: 'Proposal not found or not published' })
    return
  }
  res.json(data)
})

app.use('/api', apiRouter)

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err)
    res.status(500).json({ error: err.message || 'Server error' })
  },
)

app.listen(PORT, () => {
  const state = loadCrmState()
  console.log(`Щастя CRM API → http://localhost:${PORT}`)
  console.log(`SQLite: ${getDbPath()}`)
  console.log(
    `Seed: ${state.orders.length} orders, ${state.catalog.length} catalog items`,
  )
  console.log(
    `Admin login: ${DEMO_CREDENTIALS.admin.email} / ${DEMO_CREDENTIALS.admin.password}`,
  )
})
