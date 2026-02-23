import React from "react";
import { assets } from "../assets/assets";

const Header = () => {
  return (
    <div className="flex flex-col md:flex-row items-center bg-primary rounded-2xl px-6 md:px-12 lg:px-20 py-12 relative overflow-hidden transition-all duration-300 hover:bg-green-800">
      {/* Left Side */}
      <div className="md:w-1/2 flex flex-col items-start justify-center gap-6 text-white z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-snug animate-glow">
          Book Appointments <br /> With Trusted Doctors
        </h1>
        <p className="text-base md:text-lg font-light max-w-md transition-transform hover:scale-105">
        Easily explore a comprehensive directory of trusted doctors and schedule your appointment with convenience and confidence.
        </p>
        <div className="flex items-center gap-4">
          <img className="w-24 animate-pulse" src={assets.group_profiles} alt="Group Profiles" />
          <a
            href="#speciality"
            className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-medium shadow-md hover:bg-gray-100 transition-transform transform hover:scale-110"
          >
            Book Appointment
            <img className="w-4" src={assets.arrow_icon} alt="Arrow" />
          </a>
        </div>
      </div>

      {/* Right Side */}
      <div className="md:w-1/2 relative flex justify-center md:justify-end">
        <img
          className="w-[85%] md:w-[95%] lg:w-full max-w-md md:max-w-lg rounded-xl object-cover animate-float"
          src={assets.header_img}
          alt="Doctor Consultation"
        />
      </div>

      {/* Logo (Centered at Bottom) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <img 
          src={assets.logo} 
          alt="Logo" 
          className="w-32 md:w-40 lg:w-48 opacity-50" // Increased width and added opacity
        />
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes glow {
          0% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
          50% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
          100% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
        }
        .animate-glow { animation: glow 2.5s infinite alternate ease-in-out; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default Header;
