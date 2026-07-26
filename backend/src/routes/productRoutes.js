import { Router } from 'express'
import { authenticate, authorize } from '../auth.js'
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/productController.js'
import { uploadProductImage } from '../middleware/upload.js'

const router = Router()
router.get('/', listProducts)
router.get('/:id', getProduct)
router.post('/', authenticate, authorize('admin'), uploadProductImage, createProduct)
router.put('/:id', authenticate, authorize('admin'), uploadProductImage, updateProduct)
router.delete('/:id', authenticate, authorize('admin'), deleteProduct)

export default router;