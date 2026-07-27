import { Link } from 'react-router-dom'
import Navbar from '../public/Navbar'

export default function Forbidden() {
  return <><Navbar/><main className="min-h-[calc(100vh-88px)] bg-slate-100 grid place-items-center p-4">
    <section className="w-full max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl">
      <p className="text-7xl font-black text-red-500">403</p>
      <h1 className="mt-4 text-3xl font-bold">Forbidden: Access Denied</h1>
      <p className="mx-auto mt-3 max-w-md text-slate-600">Your account is authenticated, but it does not have the admin role required to access the TrendyShoes dashboard.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/products" className="rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-red-500">View products</Link>
        <Link to="/" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:border-red-500 hover:text-red-500">Return home</Link>
      </div>
    </section>
  </main></>
}
