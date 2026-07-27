import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, jsonOptions } from '../../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try {
      const data = await api('/auth/forgot-password', jsonOptions('POST', { email }))
      setMessage(data.message)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-slate-100 grid place-items-center p-4">
    <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-xl">
      <div><p className="font-semibold text-red-500">ACCOUNT RECOVERY</p><h1 className="text-3xl font-bold">Forgot password?</h1><p className="mt-2 text-slate-500">Enter your admin email and we’ll send a secure reset link.</p></div>
      {message && <p className="rounded-lg bg-green-50 p-3 text-green-700">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      <label className="block">Email<input required type="email" className="admin-input" value={email} onChange={(event) => setEmail(event.target.value)}/></label>
      <button disabled={busy} className="w-full rounded-lg bg-black px-4 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-60">{busy ? 'Sending…' : 'Send reset link'}</button>
      <Link to="/admin/login" className="block text-center font-semibold text-red-500">Back to login</Link>
    </form>
  </main>
}
