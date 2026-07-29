import Product from '../models/Product.js'
import Order from '../models/Order.js'
import { logActivity } from '../activity.js'

export async function createOrder(req, res, next) {
  try {
    const customerName = String(req.user?.name || '').trim()
    const email = String(req.user?.email || '').trim().toLowerCase()
    const phone = String(req.body.phone || '').trim()
    const address = String(req.body.address || '').trim()
    const quantity = Number(req.body.quantity)
    if (customerName.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Your account profile is incomplete' })
    if (phone.length < 7 || address.length < 5) return res.status(400).json({ message: 'Valid phone and delivery address are required' })
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 25) return res.status(400).json({ message: 'Quantity must be a whole number between 1 and 25' })

    const product = await Product.findById(req.body.productId).lean()
    if (!product) return res.status(404).json({ message: 'The selected shoe is no longer available' })
    if (quantity > product.stock) return res.status(400).json({ message: `Only ${product.stock} item(s) are currently in stock` })
    const order = await Order.create({ user: req.user.id, customerName, email, phone, address, product: product._id, productName: product.name, unitPrice: product.price, quantity, total: Number((product.price * quantity).toFixed(2)) })
    await logActivity(req, 'ORDER_PLACED', { orderId: order.id, productId: product._id, quantity })
    res.status(201).json({ order: { id: order.id, total: order.total, status: order.status } })
  } catch (error) { next(error) }
}

export async function listOrders(_req, res, next) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean()
    res.json({ orders: orders.map((order) => ({ ...order, id: order._id.toString(), productId: order.product.toString() })) })
  } catch (error) { next(error) }
}

export async function listMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).lean()
    res.json({ orders: orders.map((order) => ({ ...order, id: order._id.toString(), productId: order.product.toString() })) })
  } catch (error) { next(error) }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const status = String(req.body.status || '').toLowerCase()
    if (!['pending', 'confirmed', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Status must be pending, confirmed, or delivered' })
    }
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    const previousStatus = order.status
    order.status = status
    await order.save()
    await logActivity(req, 'ORDER_STATUS_UPDATED', { orderId: order.id, previousStatus, status, productName: order.productName })
    res.json({ order: { ...order.toObject(), id: order.id, productId: order.product.toString() } })
  } catch (error) { next(error) }
}
