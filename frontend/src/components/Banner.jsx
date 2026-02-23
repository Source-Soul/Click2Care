import React from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row items-center bg-primary rounded-2xl px-6 md:px-12 lg:px-20 py-8 relative overflow-hidden transition-all duration-300 hover:bg-green-800 mb-12">

      {/* Left Side */}
      <div className="md:w-1/2 flex flex-col items-start justify-center gap-6 text-white z-10">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-snug animate-glow">
  Create An Account &  <br /> Book Your Appointment <br /> With Top Trusted Doctors
</h1>

        <button
          onClick={() => {
            navigate("/login");
            scrollTo(0, 0);
          }}
          className="bg-white text-sm sm:text-base text-gray-600 px-8 py-3 rounded-full mt-6 hover:scale-105 transition-all"
        >
          Create Account
        </button>
        <div className="flex items-center gap-4">
        </div>
      </div>

      {/* Right Side */}
      <div className="md:w-1/2 relative flex justify-center md:justify-end">
  <img
    className="w-[30%] md:w-[40%] lg:w-[50%] max-w-md md:max-w-lg rounded-xl object-cover animate-float"
    src={assets.appointment_img}
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

export default Banner;
