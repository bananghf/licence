import { Router } from 'express'
import {
  authenticatePassword,
  requireAuth,
  signToken,
  type AuthRequest,
} from '../auth.js'
import { writeAudit } from '../db.js'
import { DEMO_CREDENTIALS } from '../seed.js'

export const authRouter = Router()

authRouter.post('/login', (req, res) => {
  const email = String(req.body?.email || '')
  const password = String(req.body?.password || '')
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' })
    return
  }
  const user = authenticatePassword(email, password)
  if (!user) {
    res.status(401).json({ error: 'Невірний логін або пароль' })
    return
  }
  const token = signToken(user)
  writeAudit(user.id, 'login', 'user', user.id)
  res.setHeader(
    'Set-Cookie',
    `shastya_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 86400}`,
  )
  res.json({ token, user })
})

authRouter.post('/logout', requireAuth, (req: AuthRequest, res) => {
  writeAudit(req.user?.id, 'logout', 'user', req.user?.id)
  res.setHeader(
    'Set-Cookie',
    'shastya_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  )
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user })
})

authRouter.get('/demo-credentials', (_req, res) => {
  // Only for local onboarding — not a secret vault.
  res.json({
    admin: DEMO_CREDENTIALS.admin,
    manager: DEMO_CREDENTIALS.manager,
  })
})
