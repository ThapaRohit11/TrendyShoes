import fs from 'node:fs/promises'
import path from 'node:path'
import Product from '../models/Product.js'
import { config } from '../config.js'
import { logActivity } from '../activity.js'

const imageUrl = (req, filename) => filename ? `${req.protocol}://${req.get('host')}/uploads/${filename}` : null
const present = (req, product) => {
  const value = product.toObject ? product.toObject() : product
  return { ...value, id: value._id.toString(), imageUrl: imageUrl(req, value.image) }
}
const removeUploaded = (file) => file ? fs.unlink(file.path).catch(() => {}) : Promise.resolve()

export async function listProducts(req, res, next) {
  try { res.json({ products: (await Product.find().sort({ createdAt: -1 }).lean()).map((product) => present(req, product)) }) }
  catch (error) { next(error) }
}

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).lean()
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ product: present(req, product) })
  } catch (error) { next(error) }
}

export async function createProduct(req, res, next) {
  try {
    const name = String(req.body.name || '').trim(), description = String(req.body.description || '').trim()
    const price = Number(req.body.price), stock = Number(req.body.stock)
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      await removeUploaded(req.file)
      return res.status(400).json({ message: 'Name, non-negative price, and whole-number stock are required' })
    }
    const product = await Product.create({ name, description, price, stock, image: req.file?.filename || null, createdBy: req.user.id })
    await logActivity(req, 'PRODUCT_CREATED', { productId: product.id, name })
    res.status(201).json({ product: present(req, product) })
  } catch (error) { await removeUploaded(req.file); next(error) }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) { await removeUploaded(req.file); return res.status(404).json({ message: 'Product not found' }) }
    const price = req.body.price === undefined ? product.price : Number(req.body.price)
    const stock = req.body.stock === undefined ? product.stock : Number(req.body.stock)
    const name = req.body.name === undefined ? product.name : String(req.body.name).trim()
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      await removeUploaded(req.file)
      return res.status(400).json({ message: 'Invalid product values' })
    }
    const oldImage = req.file ? product.image : null
    Object.assign(product, { name, price, stock, description: req.body.description === undefined ? product.description : String(req.body.description).trim() })
    if (req.file) product.image = req.file.filename
    await product.save()
    if (oldImage) await fs.unlink(path.join(config.uploadsDir, oldImage)).catch(() => {})
    await logActivity(req, 'PRODUCT_UPDATED', { productId: product.id, name })
    res.json({ product: present(req, product) })
  } catch (error) { await removeUploaded(req.file); next(error) }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.image) await fs.unlink(path.join(config.uploadsDir, product.image)).catch(() => {})
    await logActivity(req, 'PRODUCT_DELETED', { productId: product.id, name: product.name })
    res.json({ message: 'Product deleted successfully' })
  } catch (error) { next(error) }
}