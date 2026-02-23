import React from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";

const Footer = () => {
  return (
    <div className="bg-gray-900 text-white py-20">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex flex-col sm:grid grid-cols-3 gap-16">
          {/*---------left section------*/}
          <div className="text-center sm:text-left">
            <img className="mb-5 w-40 mx-auto sm:mx-0" src={assets.logo} alt="Logo" />
            <p className="text-sm text-gray-300 leading-relaxed text-center 
               hover:text-green-400 
                hover:animate-pulse 
                transition-all duration-300 
                shadow-lg shadow-green-500/50">
              "Pain itself is love, growth, transformation, and ultimately, a deeper understanding of life. To strive for the best, one must endure and sacrifice. Only by embracing challenges can one truly experience freedom and growth. This process leads to moments of clarity and satisfaction, even when facing difficulties. It is the pursuit of meaning that drives the journey forward."
            </p>
          </div>

          {/*---------center section------*/}
          <div className="text-center sm:text-left">
            <p className="text-xl font-semibold text-green-500 mb-5">COMPANY</p>
            <ul className="space-y-4 text-gray-400">

              <NavLink
                to="/"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <li className="hover:text-green-400 transition-all duration-300 cursor-pointer">Home</li>
              </NavLink>
              <NavLink
                to="/about"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <li className="hover:text-green-400 transition-all duration-300 cursor-pointer">About Us</li>
              </NavLink>

              <NavLink
                to="/contact"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <li className="hover:text-green-400 transition-all duration-300 cursor-pointer">Contact Us</li>
              </NavLink>

              <NavLink to="/privacy-policy">
                <li className="hover:text-green-400 transition-all duration-300 cursor-pointer">Privacy Policy</li>
              </NavLink>
            </ul>

          </div>

          {/*---------right section------*/}
          <div className="text-center sm:text-left">
            <p className="text-xl font-semibold text-green-500 mb-5">GET IN TOUCH</p>
            <ul className="space-y-4 text-gray-400">
              <li className="hover:text-green-400 transition-all duration-300 cursor-pointer">+880 1788xxxxxx</li>
              <li className="hover:text-green-400 transition-all duration-300 cursor-pointer">click2care2025@gmail.com</li>
            </ul>
          </div>
        </div>

        {/*---------footer bottom section------*/}
        <div className="border-t border-gray-700 pt-10 mt-16 text-center text-gray-500 text-xs">
          <p>&copy; {new Date().getFullYear()} Your Company Name. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
