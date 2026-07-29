import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomInt, randomUUID } from 'node:crypto'
import User from '../models/User.js'
import { cookieOptions, createSessionToken } from '../auth.js'
import { logActivity } from '../activity.js'
import { config } from '../config.js'
import { sendPasswordResetEmail, sendTwoFactorCode } from '../mailer.js'
import Session from '../models/Session.js'
import TwoFactorChallenge from '../models/TwoFactorChallenge.js'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/
const publicUser = (user) => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role })
const twoFactorCookieOptions = { httpOnly: true, secure: config.isProduction, sameSite: 'strict', maxAge: 10 * 60 * 1000, path: '/api/auth' }

async function createTwoFactorChallenge(user, req) {
  const challengeId = randomUUID()
  const code = String(randomInt(100000, 1000000))
  const signedToken = jwt.sign(
    { sub: user.id, purpose: 'two-factor-login', verificationCode: code },
    config.jwtSecret,
    { jwtid: challengeId, expiresIn: '10m', issuer: 'trendyshoes-api', audience: 'trendyshoes-two-factor' },
  )
  await TwoFactorChallenge.deleteMany({ user: user._id, consumedAt: null })
  await TwoFactorChallenge.create({ user: user._id, challengeId, signedToken, expiresAt: new Date(Date.now() + 10 * 60 * 1000) })
  try {
    await sendTwoFactorCode(user.email, code)
  } catch (error) {
    await TwoFactorChallenge.deleteOne({ challengeId })
    throw error
  }
  await logActivity(req, 'TWO_FACTOR_CODE_SENT', {}, user._id)
  return challengeId
}

export async function register(req, res, next) {
  try {
    // Intentionally allowlist fields: a client-supplied role is never read or persisted.
    const { name: rawName, email: rawEmail, password: rawPassword } = req.body
    const name = String(rawName || '').trim()
    const email = String(rawEmail || '').trim().toLowerCase()
    const password = String(rawPassword || '')
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'A valid name and email are required' })
    if (!passwordPattern.test(password)) return res.status(400).json({ message: 'Password must be at least 6 characters with uppercase and lowercase letters' })
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with that email already exists' })

    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) })
    await logActivity(req, 'USER_REGISTERED', { email }, user._id)
    res.status(201).json({ message: 'Account created. Log in to verify your email with a two-factor code.' })
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An account with that email already exists' })
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const user = await User.findOne({ email }).select('+passwordHash +sessionVersion +failedLoginAttempts +loginLockedUntil')
    if (user?.loginLockedUntil && user.loginLockedUntil > new Date()) {
      await logActivity(req, 'LOGIN_BLOCKED', { email }, user._id)
      return res.status(429).json({ message: 'Too many failed login attempts. Try again later.' })
    }
    if (!user || !user.active || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
        if (user.failedLoginAttempts >= 5) user.loginLockedUntil = new Date(Date.now() + 10 * 60 * 1000)
        await user.save()
      }
      await logActivity(req, 'LOGIN_FAILED', { email })
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    user.failedLoginAttempts = 0
    user.loginLockedUntil = null
    await user.save()
    if (user.twoFactorEnabled !== false) {
      const challengeId = await createTwoFactorChallenge(user, req)
      res.cookie('two_factor_challenge', challengeId, twoFactorCookieOptions)
      return res.json({ requiresTwoFactor: true, message: 'A verification code was sent to your email.' })
    }
    res.cookie('auth_token', await createSessionToken({ id: user._id.toString(), role: user.role, sessionVersion: user.sessionVersion }, req), cookieOptions)
    await logActivity(req, 'USER_LOGGED_IN', { email }, user._id)
    res.json({ user: publicUser(user) })
  } catch (error) { next(error) }
}

export async function logout(req, res) {
  await Session.updateOne({ tokenId: req.session.tokenId }, { revokedAt: new Date() })
  await logActivity(req, 'USER_LOGGED_OUT')
  res.clearCookie('auth_token', { ...cookieOptions, maxAge: undefined })
  res.json({ message: 'Logged out successfully' })
}

export function me(req, res) { res.json({ user: req.user }) }

export async function updateProfile(req, res, next) {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'A valid name and email are required' })

    const currentUserId = req.user.id
    const existingUser = await User.findOne({ email, _id: { $ne: currentUserId } }).lean()
    if (existingUser) return res.status(409).json({ message: 'An account with that email already exists' })

    const user = await User.findById(currentUserId).select('+sessionVersion')
    if (!user || !user.active) return res.status(401).json({ message: 'Account is unavailable' })

    user.name = name
    user.email = email
    await user.save()

    const updatedUser = { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
    req.user = updatedUser
    res.json({ user: updatedUser })
  } catch (error) { next(error) }
}

export async function changePassword(req, res, next) {
  try {
    const currentPassword = String(req.body.currentPassword || '')
    const newPassword = String(req.body.newPassword || '')
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current password and new password are required' })
    if (!passwordPattern.test(newPassword)) return res.status(400).json({ message: 'Password must be at least 6 characters with uppercase and lowercase letters' })

    const user = await User.findById(req.user.id).select('+passwordHash +sessionVersion')
    if (!user || !user.active) return res.status(401).json({ message: 'Account is unavailable' })
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(401).json({ message: 'Current password is incorrect' })

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    await user.save()
    await logActivity(req, 'PASSWORD_CHANGED', {}, user._id)
    res.json({ message: 'Password updated successfully' })
  } catch (error) { next(error) }
}

export async function verifyTwoFactor(req, res, next) {
  try {
    const code = String(req.body.code || '').trim()
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ message: 'Enter a valid six-digit verification code' })
    const challengeId = String(req.cookies.two_factor_challenge || '')
    const challenge = await TwoFactorChallenge.findOne({ challengeId, consumedAt: null, expiresAt: { $gt: new Date() } }).select('+signedToken')
    if (!challenge) {
      res.clearCookie('two_factor_challenge', { ...twoFactorCookieOptions, maxAge: undefined })
      return res.status(400).json({ message: 'The verification request is invalid or has expired' })
    }
    let payload
    try {
      payload = jwt.verify(challenge.signedToken, config.jwtSecret, { issuer: 'trendyshoes-api', audience: 'trendyshoes-two-factor' })
    } catch {
      res.clearCookie('two_factor_challenge', { ...twoFactorCookieOptions, maxAge: undefined })
      return res.status(400).json({ message: 'The verification request is invalid or has expired' })
    }
    if (payload.purpose !== 'two-factor-login' || payload.jti !== challenge.challengeId || payload.sub !== challenge.user.toString()) return res.status(400).json({ message: 'The verification request is invalid or has expired' })
    if (challenge.attempts >= 5) return res.status(429).json({ message: 'Too many incorrect codes. Log in again for a new code.' })
    if (payload.verificationCode !== code) {
      challenge.attempts += 1
      if (challenge.attempts >= 5) {
        challenge.consumedAt = new Date()
        res.clearCookie('two_factor_challenge', { ...twoFactorCookieOptions, maxAge: undefined })
      }
      await challenge.save()
      await logActivity(req, 'TWO_FACTOR_FAILED', {}, challenge.user)
      return res.status(401).json({ message: 'Incorrect verification code' })
    }
    challenge.consumedAt = new Date()
    await challenge.save()
    res.clearCookie('two_factor_challenge', { ...twoFactorCookieOptions, maxAge: undefined })
    const user = await User.findById(payload.sub).select('+sessionVersion')
    if (!user || !user.active) return res.status(401).json({ message: 'Account is unavailable' })
    res.cookie('auth_token', await createSessionToken({ id: user.id, role: user.role, sessionVersion: user.sessionVersion }, req), cookieOptions)
    await logActivity(req, 'TWO_FACTOR_VERIFIED', {}, user._id)
    await logActivity(req, 'USER_LOGGED_IN', { email: user.email }, user._id)
    res.json({ user: publicUser(user) })
  } catch (error) { next(error) }
}

export async function listSessions(req, res, next) {
  try {
    const sessions = await Session.find({ user: req.user.id, revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean()
    res.json({ sessions: sessions.map((session) => ({ id: session._id.toString(), ip: session.ip, userAgent: session.userAgent, createdAt: session.createdAt, expiresAt: session.expiresAt, current: session.tokenId === req.session.tokenId })) })
  } catch (error) { next(error) }
}

export async function revokeSession(req, res, next) {
  try {
    const session = await Session.findOneAndUpdate({ _id: req.params.id, user: req.user.id, revokedAt: null }, { revokedAt: new Date() })
    if (!session) return res.status(404).json({ message: 'Session not found' })
    if (session.tokenId === req.session.tokenId) res.clearCookie('auth_token', { ...cookieOptions, maxAge: undefined })
    await logActivity(req, 'SESSION_REVOKED', { sessionId: session.id })
    res.json({ message: 'Session revoked successfully' })
  } catch (error) { next(error) }
}

export async function logoutAll(req, res, next) {
  try {
    await Session.updateMany({ user: req.user.id, revokedAt: null }, { revokedAt: new Date() })
    res.clearCookie('auth_token', { ...cookieOptions, maxAge: undefined })
    await logActivity(req, 'ALL_SESSIONS_REVOKED')
    res.json({ message: 'All sessions logged out successfully' })
  } catch (error) { next(error) }
}

export async function forgotPassword(req, res, next) {
  const genericMessage = 'If an account exists for that email, a reset link has been sent.'
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(200).json({ message: genericMessage })
    const user = await User.findOne({ email, active: true }).select('+passwordResetVersion')
    if (user) {
      const token = jwt.sign(
        { sub: user.id, purpose: 'password-reset', resetVersion: user.passwordResetVersion || 0 },
        config.jwtSecret,
        { expiresIn: '15m', issuer: 'trendyshoes-api', audience: 'trendyshoes-password-reset' },
      )
      const resetUrl = `${config.clientUrl}/reset-password?token=${encodeURIComponent(token)}`
      try {
        await sendPasswordResetEmail(user.email, resetUrl)
        await logActivity(req, 'PASSWORD_RESET_REQUESTED', {}, user._id)
      } catch (emailError) {
        console.error('Password reset email failed:', emailError.message)
        await logActivity(req, 'PASSWORD_RESET_EMAIL_FAILED', {}, user._id)
      }
    }
    res.json({ message: genericMessage })
  } catch (error) { next(error) }
}

export async function resetPassword(req, res, next) {
  try {
    const token = String(req.body.token || '')
    const password = String(req.body.password || '')
    if (!passwordPattern.test(password)) return res.status(400).json({ message: 'Password must be at least 6 characters with uppercase and lowercase letters' })
    let payload
    try {
      payload = jwt.verify(token, config.jwtSecret, { issuer: 'trendyshoes-api', audience: 'trendyshoes-password-reset' })
    } catch {
      return res.status(400).json({ message: 'This password reset link is invalid or has expired' })
    }
    if (payload.purpose !== 'password-reset') return res.status(400).json({ message: 'This password reset link is invalid or has expired' })
    const user = await User.findById(payload.sub).select('+passwordHash +passwordResetVersion +sessionVersion')
    if (!user || !user.active || payload.resetVersion !== (user.passwordResetVersion || 0)) return res.status(400).json({ message: 'This password reset link is invalid or has expired' })
    user.passwordHash = await bcrypt.hash(password, 12)
    user.passwordResetVersion = (user.passwordResetVersion || 0) + 1
    user.sessionVersion = (user.sessionVersion || 0) + 1
    await user.save()
    await Session.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() })
    res.clearCookie('auth_token', { ...cookieOptions, maxAge: undefined })
    await logActivity(req, 'PASSWORD_RESET_COMPLETED', {}, user._id)
    res.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (error) { next(error) }
}
