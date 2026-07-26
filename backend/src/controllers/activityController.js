import Activity from '../models/Activity.js'

export async function listActivities(_req, res, next) {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(100).lean()
    res.json({ activities: activities.map((activity) => ({ ...activity, id: activity._id.toString(), userId: activity.user?.toString() || null })) })
  } catch (error) { next(error) }
}