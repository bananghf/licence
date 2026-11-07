import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db, mapUser } from './db.js'
import type { UserPublic, UserRole } from './types.js'

const JWT_SECRET =
  process.env.JWT_SECRET || 'shastya-crm-dev-secret-change-in-production'
const TOKEN_TTL = '14d'

export interface AuthRequest extends Request {
  user?: UserPublic
}

interface TokenPayload {
  sub: string
  email: string
  role: UserRole
}

export function signToken(user: UserPublic): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function findUserByEmail(email: string) {
  return db
    .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
    .get(email.trim()) as Record<string, unknown> | undefined
}

export function findUserById(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
}

export function authenticatePassword(email: string, password: string): UserPublic | null {
  const row = findUserByEmail(email)
  if (!row) return null
  const ok = bcrypt.compareSync(password, String(row.password_hash))
  if (!ok) return null
  return mapUser(row)
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)
  const cookie = req.headers.cookie
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)shastya_token=([^;]+)/)
    if (match) return decodeURIComponent(match[1])
  }
  return null
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }
  const row = findUserById(payload.sub)
  if (!row) {
    res.status(401).json({ error: 'User not found' })
    return
  }
  req.user = mapUser(row)
  next()
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      const row = findUserById(payload.sub)
      if (row) req.user = mapUser(row)
    }
  }
  next()
}
