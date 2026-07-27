import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, jsonOptions } from '../../api'

const initialForm = { customerName: '', email: '', phone: '', address: '', productId: '', quantity: 1 }

export default function BuyForm() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [busy, setBusy] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    api('/products').then(({ products: items }) => {
      setProducts(items)
      const requested = searchParams.get('product')
      const selected = items.find((item) => item.id === requested && item.stock > 0) || items.find((item) => item.stock > 0)
      if (selected) setForm((current) => ({ ...current, productId: selected.id }))
    }).catch((err) => setError(err.message))
  }, [searchParams])

  const selectedProduct = products.find((product) => product.id === form.productId)
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSuccess(null); setBusy(true)
    try {
      const { order } = await api('/orders', jsonOptions('POST', form))
      setSuccess(order)
      setForm((current) => ({ ...initialForm, productId: current.productId }))
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <main className="min-h-[calc(100vh-88px)] bg-slate-100 px-4 py-12">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
      <section className="bg-black p-8 text-white md:p-12">
        <p className="font-bold text-red-400">PLACE AN ORDER</p>
        <h1 className="mt-2 text-4xl font-bold">Your next favorite pair.</h1>
        <p className="mt-4 text-slate-300">Choose any available shoe and quantity. The TrendyShoes team will contact you to confirm delivery and payment.</p>
        {selectedProduct && <div className="mt-8 rounded-2xl bg-white/10 p-5">
          <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
          <p className="mt-2 text-slate-300">${Number(selectedProduct.price).toFixed(2)} each · {selectedProduct.stock} available</p>
          <p className="mt-4 text-2xl font-bold text-red-400">Total: ${(Number(selectedProduct.price) * Number(form.quantity || 0)).toFixed(2)}</p>
        </div>}
      </section>
      <form onSubmit={submit} className="space-y-4 p-8 md:p-12">
        <h2 className="text-2xl font-bold">Delivery details</h2>
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        {success && <div className="rounded-lg bg-green-50 p-4 text-green-800"><b>Order placed successfully.</b><p>Order #{success.id.slice(0, 8)} · Total ${Number(success.total).toFixed(2)}</p></div>}
        <label className="block">Shoe<select required className="admin-input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value, quantity: 1 })}><option value="">Select a shoe</option>{products.map((product) => <option key={product.id} value={product.id} disabled={product.stock < 1}>{product.name} — ${Number(product.price).toFixed(2)} {product.stock < 1 ? '(out of stock)' : ''}</option>)}</select></label>
        <label className="block">Quantity<input required type="number" min="1" max={Math.min(selectedProduct?.stock || 25, 25)} className="admin-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}/></label>
        <label className="block">Full name<input required minLength="2" className="admin-input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}/></label>
        <label className="block">Email<input required type="email" className="admin-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label>
        <label className="block">Phone<input required minLength="7" className="admin-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label>
        <label className="block">Delivery address<textarea required minLength="5" className="admin-input min-h-24" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}/></label>
        <button disabled={busy || !selectedProduct || selectedProduct.stock < 1} className="w-full rounded-lg bg-red-500 px-4 py-3 font-bold text-white hover:bg-black disabled:opacity-50">{busy ? 'Placing order…' : 'Place order'}</button>
      </form>
    </div>
  </main>
}
