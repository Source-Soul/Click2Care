import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>CONTACT <span className='text-gray-700 font-semibold'>US</span> </p>
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

    </div>
  )
}

export default Contact