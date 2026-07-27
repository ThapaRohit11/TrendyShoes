import { Link } from 'react-router-dom'

function ProductCard({ product }) {
  return (
    <div>
        {/* Product Image Section */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-72 w-full object-cover"/> : <div className="grid h-72 place-items-center bg-slate-200 text-slate-500">No image</div>}
          <div className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-2xl font-bold">{product.name}</h2><span className="font-bold text-red-500">${Number(product.price).toFixed(2)}</span></div><p className="mt-2 text-slate-600">{product.description}</p><p className="mt-4 text-sm font-semibold text-slate-500">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p><Link to={`/buy?product=${product.id}`} className={`mt-4 block rounded-lg px-4 py-3 text-center font-bold text-white ${product.stock > 0 ? 'bg-red-500 hover:bg-black' : 'pointer-events-none bg-slate-400'}`}>{product.stock > 0 ? 'Buy now' : 'Unavailable'}</Link></div>
        </div>
    </div>
  )
}

export default ProductCard
