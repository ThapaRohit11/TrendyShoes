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


