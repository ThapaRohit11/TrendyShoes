import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

function Navbar() {
  const { user } = useAuth();
  return (
    <nav className="w-full h-22 text-white bg-black flex items-center justify-between px-4">
      <h1 className="text-4xl font-bold hover:text-red-400 ml-2"><Link to="/">TrendyShoes</Link></h1>
      <div className="flex-grow flex justify-end">
        <ul className="hidden md:flex text-[22px] justify-evenly w-full max-w-4xl">
          <li className="mx-[25px] cursor-pointer flex items-center justify-center">
            <Link to="/home" className="hover:text-red-400">Home</Link>
          </li>
          <li className="mx-[25px] cursor-pointer flex items-center justify-center">
            <Link to="/products" className="hover:text-red-400">Products</Link>
          </li>
          <li className="mx-[25px] cursor-pointer flex items-center justify-center">
            <Link to="/about" className="hover:text-red-400">About</Link>
          </li>
          <li className="mx-[25px] cursor-pointer flex items-center justify-center">
            <Link to="/contact" className="hover:text-red-400">Contact</Link>
          </li>
        </ul>
        <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'user' ? '/dashboard' : '/login'} className="ml-4 mr-2 rounded-lg bg-red-500 px-4 py-2 text-base font-bold text-white hover:bg-red-600">{user ? 'Dashboard' : 'Login'}</Link>
      </div>
    </nav>
  );
}

export default Navbar;
