import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { config } from './config.js'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

export const app = express()
app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === config.clientUrl) return callback(null, true)
    callback(new Error('Origin is not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600,
}))
app.use(rateLimit({ windowMs: 10 * 60 * 1000, limit: 100, message: { message: 'Too many requests. Try again in 10 minutes.' }, standardHeaders: 'draft-8', legacyHeaders: false }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use('/uploads', express.static(config.uploadsDir, { fallthrough: false, maxAge: '1d' }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/activities', activityRoutes)
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))
app.use((error, _req, res, _next) => {
  console.error(error)
  if (error.message === 'Origin is not allowed by CORS') return res.status(403).json({ message: error.message })
  if (error instanceof multer.MulterError) return res.status(400).json({ message: error.message })
  res.status(500).json({ message: 'An unexpected server error occurred' })
})