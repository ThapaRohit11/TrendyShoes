import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { api } from '../../api'

function Product() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { api('/products').then((data) => setProducts(data.products)).catch((err) => setError(err.message)) }, [])
  return (
    <div>
      {/* Explore Trendy Section */}
      <h1 className="text-5xl font-bold mb-5 text-center mt-20">Explore TrendyShoes now</h1>
      {/* Product Quote Section */}
      <div className="text-center mt-10">
        <p className="text-[20px]">
        Grab your favorite pair today and step out in style.
        </p>
      </div>
      {error && <p className="mx-auto mt-8 max-w-xl rounded-lg bg-red-50 p-4 text-center text-red-700">{error}</p>}
      <div className="mx-auto grid max-w-7xl gap-8 p-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => <ProductCard key={product.id} product={product}/>)}
      </div>
      {!error && !products.length && <p className="mb-16 text-center text-slate-500">No shoes have been listed yet.</p>}
    </div>
  )
}

export default Product
