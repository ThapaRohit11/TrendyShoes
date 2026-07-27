import { Link } from 'react-router-dom'

function About() {
  return (
    <div className="h-[80vh] flex flex-col md:flex-row items-center justify-around p-4">
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 text-center">
        <p className="text-2xl md:text-4xl font-bold mb-5 md:ml-10 mt-4">
          Feel comfort with TrendyShoes
        </p>
        <p className="text-lg md:text-xl mb-6">
          Deal with comfort TrendyShoes at the best price!
        </p>
        <div className="flex justify-center">
          <Link to="/products">
            <button className="mt-8 w-36 h-12 text-white text-lg cursor-pointer border-none bg-red-500 hover:bg-red-600 rounded-lg md:rounded-none">
              Shop Now
            </button>
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-center w-full md:w-1/2 md:h-full">
        <img 
          className="h-[90%] md:w-2xl md:h-[70%] rounded-tl-[100px] rounded-br-[100px] rounded-tr-[10px] rounded-bl-[10px] object-cover" 
          src="https://i.pinimg.com/736x/52/31/fb/5231fbbc893683bfabadcd86dc1dd182.jpg" 
          alt="Trendy Shoes" 
        />
      </div>
    </div>
  )
}

export default About
