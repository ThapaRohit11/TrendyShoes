import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, jsonOptions } from '../../api'
import { useAuth } from '../../AuthContext'

export default function UserDashboard() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api('/orders/mine')
      .then(({ orders: items }) => setOrders(items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    setProfileForm({ name: user.name || '', email: user.email || '' })
  }, [user])

  const saveProfile = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSavingProfile(true)
    try {
      const data = await api('/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm) })
      setUser(data.user)
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      const data = await api('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) })
      setMessage(data.message)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const logout = async () => {
    try { await api('/auth/logout', jsonOptions('POST', {})) } finally {
      setUser(null)
      navigate('/', { replace: true })
    }
  }

  return <main className="min-h-screen bg-slate-100">
    <header className="bg-black px-4 py-5 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div><Link to="/" className="text-2xl font-bold hover:text-red-400">TrendyShoes</Link><p className="text-sm text-slate-400">Welcome, {user.name}</p></div>
        <div className="flex gap-3"><button type="button" onClick={() => setSettingsOpen((current) => !current)} className="rounded-lg border border-white/30 px-4 py-2 font-semibold">{settingsOpen ? 'Close settings' : 'Settings'}</button><Link to="/buy" className="rounded-lg bg-red-500 px-4 py-2 font-bold">Shop now</Link><button onClick={logout} className="rounded-lg border border-white/30 px-4 py-2 font-semibold">Log out</button></div>
      </div>
    </header>
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">My orders</h1>
      <p className="mt-1 text-slate-600">Only orders placed with your account appear here.</p>
      {(error || message) && <p className={`mt-6 rounded-lg p-4 ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{error || message}</p>}
      {settingsOpen && <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Profile info</h2>
          <p className="mt-1 text-sm text-slate-500">Update the name and email tied to your account.</p>
          <div className="mt-5 space-y-4">
            <label className="block">Full name<input required minLength="2" className="admin-input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></label>
            <label className="block">Email<input required type="email" className="admin-input" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></label>
            <button disabled={savingProfile} className="rounded-lg bg-red-500 px-4 py-3 font-bold text-white disabled:opacity-60">{savingProfile ? 'Saving…' : 'Save profile'}</button>
          </div>
        </form>
        <form onSubmit={changePassword} className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Change password</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a new password for this account.</p>
          <div className="mt-5 space-y-4">
            <label className="block">Current password<input required type="password" className="admin-input" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></label>
            <label className="block">New password<input required type="password" minLength="6" className="admin-input" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></label>
            <label className="block">Confirm new password<input required type="password" minLength="6" className="admin-input" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></label>
            <button disabled={savingPassword} className="rounded-lg bg-black px-4 py-3 font-bold text-white disabled:opacity-60">{savingPassword ? 'Updating…' : 'Change password'}</button>
          </div>
        </form>
      </div>}
      {loading ? <p className="mt-8 text-slate-500">Loading your orders…</p> : <div className="mt-8 grid gap-5">
        {orders.map((order) => <article key={order.id} className="rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Order #{order.id.slice(0, 8)}</p><h2 className="mt-1 text-xl font-bold">{order.productName}</h2></div><span className={`rounded-full px-3 py-1 text-sm font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{order.status}</span></div>
          <div className="mt-5 grid gap-3 border-t pt-5 text-sm sm:grid-cols-3"><p><span className="text-slate-500">Quantity</span><br/><b>{order.quantity}</b></p><p><span className="text-slate-500">Total</span><br/><b>${Number(order.total).toFixed(2)}</b></p><p><span className="text-slate-500">Placed</span><br/><b>{new Date(order.createdAt).toLocaleDateString()}</b></p></div>
        </article>)}
        {!orders.length && !error && <div className="rounded-2xl bg-white p-10 text-center shadow"><h2 className="text-xl font-bold">No orders yet</h2><p className="mt-2 text-slate-500">Your first order will appear here.</p><Link to="/products" className="mt-5 inline-block font-bold text-red-500">Browse shoes →</Link></div>}
      </div>}
    </section>
  </main>
}
