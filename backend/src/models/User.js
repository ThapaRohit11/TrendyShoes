import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  active: { type: Boolean, default: true },
  sessionVersion: { type: Number, default: 0, select: false },
  passwordResetVersion: { type: Number, default: 0, select: false },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  loginLockedUntil: { type: Date, default: null, select: false },
  twoFactorEnabled: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('User', userSchema)