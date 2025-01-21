import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500'>
      <p> ABOUT <span className='text-gray-700 font-medium'>US</span></p>
      </div>    

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>

          <p>Welcome to Click2Care, your trusted partner in managing healthcare needs conveniently and efficiently. At Click2Care, we understand the challenges individuals face when scheduling doctor appointments and managing health records.</p>
          <p>Click2Care is dedicated to excellence in healthcare technology. We are constantly improving our platform by integrating the latest advancements to enhance the user experience and provide superior service. Whether you are booking your first appointment or managing ongoing care, Click2Care is here to support you every step of the way.</p>
          <b className='text-gray-900'>Our Vision</b>
          <p>Our vision at Click2Care is to create a seamless healthcare experience for every user. We aim to bridge the gap between patients and healthcare providers, ensuring that accessing the care you need is simple and timely.

          </p>
        </div>
      </div>

      <div className=' text-xl my-4'>
      <p className="text-gray-800 font-semibold">WHY CHOOSE US</p>
      </div>
      {/* colums */}
      <div className='flex flex-col md:flex-row mb-20'>

      <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>

          <b> Efficiency</b>
          <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
        </div>

        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>

          <b>Convenience</b>
          <p>Access to a network of trusted healthcare professionals in your area.</p>
        </div>

        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>

          <b>Personalization</b>
          <p>Tailored recommendations and reminders to help you stay on top of your health.</p>
        </div>

      </div>
    </div>
  )
}

export default About