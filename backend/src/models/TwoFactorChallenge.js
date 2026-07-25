import mongoose from 'mongoose'

const twoFactorChallengeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  challengeId: { type: String, required: true, unique: true, index: true },
  signedToken: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
  consumedAt: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.model('TwoFactorChallenge', twoFactorChallengeSchema)