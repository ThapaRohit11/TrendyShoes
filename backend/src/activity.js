import Activity from './models/Activity.js'

export async function logActivity(req, action, details = {}, userId = req.user?.id || null) {
  try {
    await Activity.create({ user: userId, action, details, ip: req.ip, userAgent: req.get('user-agent') || 'unknown' })
  } catch (error) {
    console.error('Activity logging failed:', error.message)
  }
}