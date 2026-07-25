import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true, index: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: 'unknown' },
  userAgent: { type: String, default: 'unknown' },
}, { timestamps: true })

activitySchema.index({ createdAt: -1 })
export default mongoose.model('Activity', activitySchema)