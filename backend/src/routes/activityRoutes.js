import { Router } from 'express'
import { authenticate, authorize } from '../auth.js'
import { listActivities } from '../controllers/activityController.js'

const router = Router()
router.get('/', authenticate, authorize('admin'), listActivities)

export default router;