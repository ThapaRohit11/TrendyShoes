import { Link } from 'react-router-dom';

function Navbar() {
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
      </div>
    </nav>
  );
}

export default Navbar;
