import {BrowserRouter, Routes, Route} from "react-router-dom"
import AppLayout from "./components/public/AppLayout"
import Home from "./components/public/Home"
import Product from "./components/public/Product"
import About from "./components/public/About"
import Contact from "./components/public/Contact"
import AuthPage from "./components/admin/AuthPage"
import Dashboard from "./components/admin/Dashboard"
import ProtectedRoute from "./components/admin/ProtectedRoute"
import BuyForm from "./components/public/BuyForm"
import ForgotPassword from "./components/admin/ForgotPassword"
import ResetPassword from "./components/admin/ResetPassword"
import Forbidden from "./components/admin/Forbidden"
import UserDashboard from "./components/user/UserDashboard"

function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AppLayout/>}>
          <Route index element={<Home/>}/>
          <Route path="home" element={<Home/>}/>
          <Route path="products" element={<Product/>}/>
          <Route path="about" element={<About/>}/>
          <Route path="contact" element={<Contact/>}/>
          <Route path="buy" element={<BuyForm/>}/>
        </Route>
        <Route path="/login" element={<AuthPage/>}/>
        <Route path="/signup" element={<AuthPage register/>}/>
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/reset-password" element={<ResetPassword/>}/>
        <Route path="/admin/login" element={<AuthPage/>}/>
        <Route path="/admin/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/admin/reset-password" element={<ResetPassword/>}/>
        <Route path="/forbidden" element={<Forbidden/>}/>
        <Route element={<ProtectedRoute role="admin" loginPath="/login"/>}>
          <Route path="/admin" element={<Dashboard/>}/>
        </Route>
        <Route element={<ProtectedRoute role="user" loginPath="/login"/>}>
          <Route path="/dashboard" element={<UserDashboard/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
