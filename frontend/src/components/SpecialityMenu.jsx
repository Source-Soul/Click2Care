import React from "react";
import { specialityData } from "../assets/assets";
import { Link } from "react-router-dom";

const SpecialityMenu = () => {
  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-gray-800"
      id="speciality"
    >
      <div className="w-24 h-1 bg-lime-500 rounded-full"></div>

      {/* Heading */}
      <h1 className="text-3xl font-medium text-lime-900 text-center">Search Doctors by Speciality</h1>

      {/* Paragraph */}
      <p className="sm:w-1/3 text-center text-sm">
        Access a wide range of qualified doctors and conveniently schedule your appointment with just a few clicks, ensuring a seamless healthcare experience.
      </p>

      {/* Bottom Line */}
      <div className="w-24 h-1 bg-lime-500 rounded-full"></div>
      <div className="flex sm:justify-center gap-4 pt-5 w-full overflow-x-auto">
        {specialityData.map((item, index) => (
          <Link
            onClick={() => window.scrollTo(0, 0)}
            className="flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-5px] transition-all duration-500 relative group"
            key={index}
            to={`/doctors/${item.speciality}`}
          >
            <div className="relative">
              {/* Image inside a Square with Rounded Corners */}
              <img
                className="w-20 sm:w-28 mb-2 rounded-lg transition-all duration-500 shadow-md"
                src={item.image}
                alt={item.speciality}
              />
              {/* Glowing Effect Outside Border */}
              <div className="absolute inset-0 w-full h-full rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 
              bg-lime-300/50"></div>
            </div>
            {/* Specialty Text */}
            <p className="text-center font-semibold px-3 py-1 rounded-md shadow-md 
            group-hover:bg-lime-600 group-hover:text-white transition-all duration-300">
              {item.speciality}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SpecialityMenu;

