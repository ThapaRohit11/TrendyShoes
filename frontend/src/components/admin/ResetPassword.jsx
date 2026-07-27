import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, jsonOptions } from '../../api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const token = searchParams.get('token') || ''

  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage('')
    if (password !== confirmPassword) return setError('Passwords do not match')
    setBusy(true)
    try {
      const data = await api('/auth/reset-password', jsonOptions('POST', { token, password }))
      setMessage(data.message); setPassword(''); setConfirmPassword('')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-slate-100 grid place-items-center p-4">
    <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-xl">
      <div><p className="font-semibold text-red-500">SECURE RESET</p><h1 className="text-3xl font-bold">Choose a new password</h1><p className="mt-2 text-slate-500">Use at least 6 characters with uppercase and lowercase letters.</p></div>
      {!token && <p className="rounded-lg bg-red-50 p-3 text-red-700">The reset token is missing. Request a new reset link.</p>}
      {message && <p className="rounded-lg bg-green-50 p-3 text-green-700">{message} <Link className="font-bold underline" to="/admin/login">Log in</Link></p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      <label className="block">New password<input required type="password" minLength="6" className="admin-input" value={password} onChange={(event) => setPassword(event.target.value)}/></label>
      <label className="block">Confirm password<input required type="password" minLength="6" className="admin-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}/></label>
      <button disabled={busy || !token || Boolean(message)} className="w-full rounded-lg bg-black px-4 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-60">{busy ? 'Resetting…' : 'Reset password'}</button>
      {!message && <Link to="/admin/forgot-password" className="block text-center font-semibold text-red-500">Request another link</Link>}
    </form>
  </main>
}
