import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { config } from './config.js'
import User from './models/User.js'
import Session from './models/Session.js'

export async function createSessionToken(user, req) {
  const tokenId = randomUUID()
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
  await Session.create({ user: user.id, tokenId, expiresAt, ip: req.ip, userAgent: req.get('user-agent') || 'unknown' })
  return jwt.sign({ sub: user.id, role: user.role, sessionVersion: user.sessionVersion || 0 }, config.jwtSecret, { jwtid: tokenId, expiresIn: '8h', issuer: 'trendyshoes-api', audience: 'trendyshoes-admin' })
}

export const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
}

export async function authenticate(req, res, next) {
  const token = req.cookies.auth_token
  if (!token) return res.status(401).json({ message: 'Authentication required' })
  try {
    const payload = jwt.verify(token, config.jwtSecret, { issuer: 'trendyshoes-api', audience: 'trendyshoes-admin' })
    if (!payload.jti) throw new Error('Session identifier is missing')
    const user = await User.findById(payload.sub).select('+sessionVersion').lean()
    if (!user || !user.active || payload.sessionVersion !== (user.sessionVersion || 0)) return res.status(401).json({ message: 'Account is unavailable' })
    const session = await Session.findOne({ tokenId: payload.jti, user: user._id, revokedAt: null, expiresAt: { $gt: new Date() } }).lean()
    if (!session) return res.status(401).json({ message: 'Session has expired or was revoked' })
    req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
    req.session = { id: session._id.toString(), tokenId: session.tokenId }
    next()
  } catch {
    res.clearCookie('auth_token', { ...cookieOptions, maxAge: undefined })
    return res.status(401).json({ message: 'Session is invalid or expired' })
  }
}

export function authorize(...roles) {
  return (req, res, next) => roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to perform this action' })
}