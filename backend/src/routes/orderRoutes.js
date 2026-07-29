import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, authorize } from '../auth.js'
import { createOrder, listMyOrders, listOrders, updateOrderStatus } from '../controllers/orderController.js'

const router = Router()
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })
router.post('/', orderLimiter, authenticate, authorize('user'), createOrder)
router.get('/mine', authenticate, authorize('user'), listMyOrders)
router.get('/', authenticate, authorize('admin'), listOrders)
router.patch('/:id/status', authenticate, authorize('admin'), updateOrderStatus)

export default router;
