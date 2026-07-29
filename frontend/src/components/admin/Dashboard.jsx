import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, jsonOptions } from '../../api'
import { useAuth } from '../../AuthContext'

const emptyForm = { name: '', description: '', price: '', stock: '', image: null }

export default function Dashboard() {
  const [products, setProducts] = useState([]), [orders, setOrders] = useState([]), [activities, setActivities] = useState([])
  const [activePage, setActivePage] = useState('products')
  const [form, setForm] = useState(emptyForm), [editing, setEditing] = useState(null)
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const { user, setUser } = useAuth(); const navigate = useNavigate()
  const load = useCallback(async () => {
    try {
      const [productData, orderData, activityData] = await Promise.all([api('/products'), api('/orders'), api('/activities')])
      setProducts(productData.products); setOrders(orderData.orders); setActivities(activityData.activities)
    } catch (err) { setError(err.message) }
  }, [])
  useEffect(() => { load() }, [load])

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => value !== null && body.append(key, value))
    try {
      await api(editing ? `/products/${editing}` : '/products', { method: editing ? 'PUT' : 'POST', body })
      setMessage(editing ? 'Product updated.' : 'Product added.'); cancel(); await load()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  const edit = (product) => { setEditing(product.id); setForm({ name: product.name, description: product.description, price: product.price, stock: product.stock, image: null }); scrollTo({ top: 0, behavior: 'smooth' }) }
  const cancel = () => { setEditing(null); setForm(emptyForm); const input = document.querySelector('#product-image'); if (input) input.value = '' }
  const remove = async (product) => {
    if (!confirm(`Delete ${product.name}?`)) return
    try { await api(`/products/${product.id}`, { method: 'DELETE' }); setMessage('Product deleted.'); await load() } catch (err) { setError(err.message) }
  }
  const changeOrderStatus = async (orderId, status) => {
    setError(''); setMessage('')
    try {
      await api(`/orders/${orderId}/status`, jsonOptions('PATCH', { status }))
      setMessage(`Order marked as ${status}.`)
      await load()
    } catch (err) { setError(err.message) }
  }
  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); navigate('/login') }

  return <main className="min-h-screen bg-slate-100 p-4 md:p-8">
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="overflow-hidden rounded-2xl bg-black text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div><p className="font-bold text-red-400">TRENDYSHOES ADMIN</p><p className="text-sm text-slate-400">Signed in as {user.name}</p></div>
          <div className="flex gap-3"><a href="/products" className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">View store</a><button onClick={logout} className="rounded-lg bg-red-500 px-4 py-2 font-semibold hover:bg-red-600">Log out</button></div>
        </div>
        <nav className="flex overflow-x-auto border-t border-white/10 px-3 md:px-6" aria-label="Admin navigation">
          {[['products', 'Products', products.length], ['orders', 'Orders', orders.length], ['activity', 'Activity log', activities.length]].map(([page, label, count]) => <button key={page} onClick={() => { setActivePage(page); setError(''); setMessage('') }} className={`whitespace-nowrap border-b-2 px-4 py-4 font-semibold transition ${activePage === page ? 'border-red-500 text-red-400' : 'border-transparent text-slate-300 hover:text-white'}`}>{label}<span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span></button>)}
        </nav>
      </header>
      <div><h1 className="text-3xl font-bold">{activePage === 'products' ? 'Product dashboard' : activePage === 'orders' ? 'Customer orders' : 'Activity log'}</h1><p className="mt-1 text-slate-500">{activePage === 'products' ? 'Add, edit, and remove shoes from your store.' : activePage === 'orders' ? 'Review orders submitted by customers.' : 'Review authentication, product, and order events.'}</p></div>
      {(error || message) && <p className={`rounded-lg p-3 ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{error || message}</p>}
      {activePage === 'products' && <section className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow"><h2 className="text-xl font-bold">{editing ? 'Edit product' : 'Add a shoe'}</h2>
          <label className="block">Name<input required className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block">Description<textarea className="admin-input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3"><label>Price<input required min="0" step="0.01" type="number" className="admin-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label><label>Stock<input required min="0" step="1" type="number" className="admin-input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label></div>
          <label className="block">Image (JPG, PNG, WEBP; max 5 MB)<input id="product-image" accept="image/jpeg,image/png,image/webp" type="file" className="mt-2 w-full" onChange={(e) => setForm({ ...form, image: e.target.files[0] || null })} /></label>
          <div className="flex gap-2"><button disabled={busy} className="flex-1 rounded-lg bg-red-500 px-4 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>{editing && <button type="button" onClick={cancel} className="rounded-lg border px-4">Cancel</button>}</div>
        </form>
        <div className="overflow-hidden rounded-2xl bg-white shadow"><div className="border-b p-5"><h2 className="text-xl font-bold">Products ({products.length})</h2></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50"><tr><th className="p-4">Product</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Actions</th></tr></thead><tbody>{products.map((product) => <tr className="border-t" key={product.id}><td className="p-4"><div className="flex min-w-52 items-center gap-3">{product.imageUrl ? <img src={product.imageUrl} className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-slate-200" />}<div><b>{product.name}</b><p className="max-w-xs truncate text-sm text-slate-500">{product.description}</p></div></div></td><td className="p-4">${Number(product.price).toFixed(2)}</td><td className="p-4">{product.stock}</td><td className="p-4"><div className="flex gap-2"><button onClick={() => edit(product)} className="text-blue-600">Edit</button><button onClick={() => remove(product)} className="text-red-600">Delete</button></div></td></tr>)}</tbody></table>{!products.length && <p className="p-8 text-center text-slate-500">No products yet. Add your first shoe.</p>}</div></div>
      </section>}
      {activePage === 'orders' && <section className="overflow-hidden rounded-2xl bg-white shadow"><div className="border-b p-5"><h2 className="text-xl font-bold">All orders ({orders.length})</h2><p className="text-sm text-slate-500">Order details are visible only to admins.</p></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50"><tr><th className="p-4">Customer</th><th className="p-4">Order</th><th className="p-4">Delivery</th><th className="p-4">Total</th><th className="p-4">Placed</th><th className="p-4">Status</th></tr></thead><tbody>{orders.map((order) => <tr className="border-t align-top" key={order.id}><td className="p-4"><b>{order.customerName}</b><p className="text-sm text-slate-500">{order.email}</p><p className="text-sm text-slate-500">{order.phone}</p></td><td className="p-4"><b>{order.productName}</b><p className="text-sm text-slate-500">Quantity: {order.quantity}</p></td><td className="max-w-xs p-4 text-sm">{order.address}</td><td className="p-4 font-bold">${Number(order.total).toFixed(2)}</td><td className="p-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</td><td className="p-4"><select aria-label={`Status for ${order.productName}`} value={order.status} onChange={(event) => changeOrderStatus(order.id, event.target.value)} className={`min-w-32 rounded-lg border px-3 py-2 text-sm font-bold uppercase outline-none ${order.status === 'delivered' ? 'border-green-200 bg-green-50 text-green-700' : order.status === 'confirmed' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="delivered">Delivered</option></select></td></tr>)}</tbody></table>{!orders.length && <p className="p-8 text-center text-slate-500">No customer orders yet.</p>}</div></section>}
      {activePage === 'activity' && <section className="overflow-hidden rounded-2xl bg-white shadow"><div className="border-b p-5"><h2 className="text-xl font-bold">Recent activity ({activities.length})</h2><p className="text-sm text-slate-500">The latest 100 recorded security and application events.</p></div><div className="divide-y">{activities.map((item) => <div key={item.id} className="grid gap-2 p-5 md:grid-cols-[1fr_auto]"><div><b>{item.action.replaceAll('_', ' ')}</b>{item.details?.name && <span className="text-slate-500"> — {item.details.name}</span>}<div className="mt-1 flex flex-wrap gap-x-4 text-sm text-slate-500"><span>User: {item.userId ? item.userId.slice(0, 8) : 'Guest'}</span><span>IP: {item.ip}</span>{item.details?.email && <span>Email: {item.details.email}</span>}</div></div><time className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></div>)}{!activities.length && <p className="p-8 text-center text-slate-500">No activity recorded.</p>}</div></section>}
    </div>
  </main>
}
