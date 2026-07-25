import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true, minlength: 7 },
  address: { type: String, required: true, trim: true, minlength: 5 },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 25, validate: Number.isInteger },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'delivered'], default: 'pending' },
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)