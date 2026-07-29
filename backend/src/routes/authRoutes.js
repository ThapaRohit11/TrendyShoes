import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../auth.js'
import { changePassword, forgotPassword, listSessions, login, logout, logoutAll, me, register, resetPassword, revokeSession, updateProfile, verifyTwoFactor } from '../controllers/authController.js'

const router = Router()
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false })
const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, skipSuccessfulRequests: true, message: { message: 'Too many failed login attempts. Try again in 10 minutes.' }, standardHeaders: 'draft-8', legacyHeaders: false })

router.post('/register', authLimiter, register)
router.post('/login', loginLimiter, login)
router.post('/verify-2fa', loginLimiter, verifyTwoFactor)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)
router.patch('/me', authenticate, updateProfile)
router.post('/change-password', authenticate, changePassword)
router.get('/sessions', authenticate, listSessions)
router.delete('/sessions/:id', authenticate, revokeSession)
router.post('/logout-all', authenticate, logoutAll)

export default router;