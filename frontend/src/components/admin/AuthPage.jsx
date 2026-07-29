import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, jsonOptions } from '../../api'
import { useAuth } from '../../AuthContext'
import Navbar from '../public/Navbar'

export default function AuthPage({ register = false }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [awaitingTwoFactor, setAwaitingTwoFactor] = useState(false)
  const [code, setCode] = useState('')
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const finishLogin = async (loggedInUser) => {
    setUser(loggedInUser)
    navigate(loggedInUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }

  const submit = async (event) => {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true)
    try {
      const data = await api(`/auth/${register ? 'register' : 'login'}`, jsonOptions('POST', form))
      if (register) {
        navigate('/login', { replace: true })
      } else if (data.requiresTwoFactor) {
        setAwaitingTwoFactor(true)
        setSuccess(data.message)
      } else {
        await finishLogin(data.user)
      }
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const verifyCode = async (event) => {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const data = await api('/auth/verify-2fa', jsonOptions('POST', { code }))
      await finishLogin(data.user)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <><Navbar/><main className="min-h-[calc(100vh-88px)] bg-slate-100 grid place-items-center p-4">
    <form onSubmit={awaitingTwoFactor ? verifyCode : submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-5">
      {awaitingTwoFactor ? <>
        <div><p className="text-red-500 font-semibold">TWO-FACTOR AUTHENTICATION</p><h1 className="text-3xl font-bold">Check your email</h1><p className="mt-2 text-slate-500">Enter the six-digit code we sent you. It expires in 10 minutes.</p></div>
        {success && <p className="rounded-lg bg-green-50 p-3 text-green-700">{success}</p>}
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        <label className="block">Verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" className="admin-input text-center text-2xl tracking-[0.5em]" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}/></label>
        <button disabled={busy || code.length !== 6} className="w-full rounded-lg bg-black px-4 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-60">{busy ? 'Verifying…' : 'Verify and log in'}</button>
        <button type="button" onClick={() => { setAwaitingTwoFactor(false); setCode(''); setSuccess(''); setError('') }} className="w-full text-center font-semibold text-red-500">Back to login</button>
      </> : <>
      <div><p className="text-red-500 font-semibold">{register ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</p><h1 className="text-3xl font-bold">{register ? 'Create your account' : 'Log in to your account'}</h1></div>
      {success && <p className="rounded-lg bg-green-50 p-3 text-green-700">{success} <Link className="font-bold underline" to="/login">Log in</Link></p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {register && <label className="block">Name<input required minLength="2" className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
      <label className="block">Email<input required type="email" className="admin-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="block">Password<input required type="password" minLength="6" className="admin-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      {!register && <div className="text-right"><Link className="text-sm font-semibold text-red-500 hover:underline" to="/forgot-password">Forgot password?</Link></div>}
      {register && <p className="text-sm text-slate-500">At least 6 characters, including uppercase and lowercase letters.</p>}
      <button disabled={busy} className="w-full rounded-lg bg-black px-4 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-60">{busy ? 'Please wait…' : register ? 'Register' : 'Log in'}</button>
      <p className="text-center text-slate-600">{register ? 'Already registered?' : 'New to TrendyShoes?'} <Link className="font-semibold text-red-500" to={register ? '/login' : '/signup'}>{register ? 'Log in' : 'Create account'}</Link></p>
      </>}
    </form>
  </main></>
}
