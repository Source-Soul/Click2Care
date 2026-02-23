import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <div>
      {/* ABOUT US SECTION */}
      <div className="text-center relative">
        <div className="w-20 h-1 bg-green-500 mx-auto mb-2"></div>
        <p
          className="text-3xl font-bold text-gray-700"
          style={{
            animation: "glow 1.5s infinite alternate",
            textShadow: "0 0 5px rgba(34, 197, 94, 0.6)",
          }}
        >
          CONTACT <span className="text-primary">US</span>
        </p>
        <div className="w-20 h-1 bg-green-500 mx-auto mt-2"></div>
      </div>
      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm'>

        <img className='w-full md:max-w-[360px]' src={assets.contact_image} alt="" />
      <div className='flex flex-col justify-center items-start gap-6'>
        <p className='font-semibold text-lg text-gray-600'>OUR OFFICE</p>
        <p className='text-gray-500'>54709 Willms Station <br />
        Suite 350, Washington, USA</p>
        <p className='text-gray-500'>Tel: (017) 1234-xxxx <br /> Email: click2carexxxx@gmail.com</p>
        <p className='font-semibold text-lg text-gray-600'>Career Opportunities at <span className='text-green-700 '>Click2Care</span> <br /> 
        <span className='font-normal text-gray-500 text-sm'>Learn more about our teams and job openings.</span></p>
        <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-300'>
                Explore Jobs </button>

      </div>
        
      </div>  
                {/* Inline CSS for Glow Effect */}
      <style>
        {`
          @keyframes glow {
            0% { text-shadow: 0 0 5px rgba(34, 197, 94, 0.6); }
            50% { text-shadow: 0 0 15px rgba(34, 197, 94, 0.8); }
            100% { text-shadow: 0 0 5px rgba(34, 197, 94, 0.6); }
          }
        `}
      </style>
    </div>
  )
}

export default Contact