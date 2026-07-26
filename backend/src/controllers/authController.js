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


