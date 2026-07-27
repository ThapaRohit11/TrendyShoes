import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="md:mt-30 mt-10 mb-10 flex flex-col md:flex-row items-center justify-around">
      {/* Right Container */}
      <div className="w-full md:w-1/2 flex items-center justify-center mt-6 md:mt-0">
        <img
          className="w-4/5 rounded-tl-[120px] rounded-br-[120px]"
          src="https://thumbs.dreamstime.com/b/overhead-view-two-young-skateboarders-tying-shoelaces-sitting-grass-park-overhead-view-two-young-261636563.jpg"
          alt="Shoelaces"
        />
      </div>
      {/* Left Container */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-10">
        <p className="text-5xl font-bold text-left mb-5">
          Fashion that cares
          <br/>
          Comfort that inspires
        </p>
        <p className="text-[20px] text-justify mb-6">
          Welcome to TrandyShoes,
          a premier online retailer dedicated to offering a curated selection of high-quality footwear designed to meet the needs of today’s discerning customers.
          Our extensive collection features a diverse range of shoes, from sophisticated business attire to casual, everyday wear, all crafted with an emphasis on both style and comfort.
          With a keen eye on the latest trends and a commitment to exceptional craftsmanship, we strive to provide footwear that not only enhances your wardrobe but supports your lifestyle.
          Experience the perfect blend of elegance, durability, and performance at TrandyShoes—where quality meets innovation in every step.
        </p>
        <Link to="/products">
          <button className="bg-red-600 text-white px-10 py-3 text-lg hover:bg-red-700 hover:cursor-pointer">
            Explore
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Home
