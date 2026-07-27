function Contact() {
  return (
    <div className="text-center mt-10">
      <h3 className="text-5xl font-bold italic mb-5 text-center text-slate-900">Connect with Us</h3>
      <div className="flex justify-center items-center mt-5 space-x-6">
        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-facebook text-5xl p-4 hover:cursor-pointer text-blue-500 hover:text-blue-600"></i>
        </a>
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-instagram text-5xl p-4 hover:cursor-pointer text-pink-600 hover:text-pink-700"></i>
        </a>
        <a href="https://www.whatsapp.com" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-whatsapp text-5xl p-4 hover:cursor-pointer text-green-500 hover:text-green-700"></i>
        </a>
      </div>
      <p className="mt-12 text-[20px]">
        Copyright {new Date().getFullYear()}© <span className="bg-red-400 p-2 text-white font-bold">TrendyShoes</span>
      </p>
    </div>
  )
}

export default Contact
