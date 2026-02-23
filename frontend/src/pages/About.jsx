import React from "react";
import { assets } from "../assets/assets";

const About = () => {
  return (
    <div className="px-5 md:px-20 py-10">
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
          ABOUT <span className="text-primary">US</span>
        </p>
        <div className="w-20 h-1 bg-green-500 mx-auto mt-2"></div>
      </div>

      {/* CONTENT SECTION */}
      <div className="my-10 flex flex-col md:flex-row gap-12 items-center">
        {/* Bigger Image */}
        <img className="w-full md:max-w-[450px]" src={assets.about_image} alt="About Us" />

        {/* Description Box with Double Border */}
        <div
          className="flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600 p-6 rounded-lg relative"
          style={{
            border: "4px double gray",
          }}
        >
          <p>
            Welcome to Click2Care, your trusted partner in managing healthcare needs conveniently and efficiently. At Click2Care, we understand the challenges individuals face when scheduling doctor appointments and managing health records.
          </p>
          <p>
            Click2Care is dedicated to excellence in healthcare technology. We are constantly improving our platform by integrating the latest advancements to enhance the user experience and provide superior service. Whether you are booking your first appointment or managing ongoing care, Click2Care is here to support you every step of the way.
          </p>

          <b className="text-gray-900">Our Vision</b>
          <p>
            Our vision at Click2Care is to create a seamless healthcare experience for every user. We aim to bridge the gap between patients and healthcare providers, ensuring that accessing the care you need is simple and timely.
          </p>

          {/* LOGO IN BOTTOM RIGHT */}
          <img className="w-16 absolute bottom-2 right-2" src={assets.logo} alt="Logo" />
        </div>
      </div>

      {/* WHY CHOOSE US SECTION (No Changes Needed) */}
      <div>
        <p className="text-xl text-gray-800 font-semibold mb-4">WHY CHOOSE US</p>
        <div className="flex flex-col md:flex-row mb-20">
          <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
            <b> Efficiency</b>
            <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
          </div>

          <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
            <b>Convenience</b>
            <p>Access to a network of trusted healthcare professionals in your area.</p>
          </div>

          <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
            <b>Personalization</b>
            <p>Tailored recommendations and reminders to help you stay on top of your health.</p>
          </div>
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
  );
};

export default About;
