import React, { useState, useContext } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, setToken, userData } = useContext(AppContext);
  const [showMenu, setShowMenu] = useState(false);

  const logout = () => {
    setToken(false);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400">
      <img
        onClick={() => navigate("/")}
        className="w-44 cursor-pointer"
        src={assets.logo}
        alt="Logo"
      />
      <ul className="hidden md:flex items-start gap-5 font-medium">
        <NavLink to={"/"} className="nav-box">
          <li className="nav-item">HOME</li>
          <hr className="nav-underline" />
        </NavLink>
        <NavLink to={"/doctors"} className="nav-box">
          <li className="nav-item">ALL DOCTORS</li>
          <hr className="nav-underline" />
        </NavLink>
        <NavLink to={"/about"} className="nav-box">
          <li className="nav-item">ABOUT</li>
          <hr className="nav-underline" />
        </NavLink>
        <NavLink to={"/contact"} className="nav-box">
          <li className="nav-item">CONTACT</li>
          <hr className="nav-underline" />
        </NavLink>

        <style>{`
          .nav-box {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 150px;
            height: 50px;
            background-color: #ffffff;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            transition: all 0.3s ease-in-out;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          .nav-box:hover {
            background-color: #4CAF50;
            transform: scale(1.1);
            box-shadow: 0 0 15px rgba(76, 175, 80, 0.7);
          }
          .nav-item {
            color: #4CAF50;
            transition: color 0.3s ease-in-out;
          }
          .nav-box:hover .nav-item {
            color: white;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            animation: blink 0.7s infinite alternate;
          }
          .nav-box:hover .nav-underline {
            display: block;
            animation: underlineGrow 0.4s ease-in-out forwards;
          }
          .nav-underline {
            display: none;
            height: 2px;
            background-color: white;
            width: 0;
            transition: width 0.3s ease-in-out, opacity 0.3s ease-in-out;
          }
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          @keyframes underlineGrow {
            0% { width: 0; opacity: 0; }
            100% { width: 70%; opacity: 1; }
          }
        `}</style>
      </ul>

      <div className="flex items-center gap-4">
        {token ? (
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <img
              className="w-8 rounded-full"
              src={userData?.image || assets.profile_pic}
              alt="Profile"
            />
            <img className="w-2.5" src={assets.dropdown_icon} alt="" />
            <div className="absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block">
              <div className="min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4">
                <p
                  onClick={() => navigate("/my-profile")}
                  className="hover:text-black cursor-pointer"
                >
                  My Profile
                </p>
                <p
                  onClick={() => navigate("/my-appointments")}
                  className="hover:text-black cursor-pointer"
                >
                  My Appointments
                </p>
                <p onClick={logout} className="hover:text-black cursor-pointer">
                  Logout
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block"
          >
            Create account
          </button>
        )}
        <img
          onClick={() => setShowMenu(true)}
          className="w-6 md:hidden"
          src={assets.menu_icon}
          alt=""
        />

        {/* Mobile Menu */}
        <div
          className={`${
            showMenu ? "fixed w-full" : "h-0 w-0"
          } md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <img className="w-36" src={assets.logo} alt="" />
            <img
              className="w-6 h-6"
              onClick={() => setShowMenu(false)}
              src={assets.cross_icon}
              alt=""
            />
          </div>
          <ul className="flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium">
            <NavLink onClick={() => setShowMenu(false)} to="/">
              <p className="px-4 py-2 rounded inline-block">Home</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/doctors">
              <p className="px-4 py-2 rounded inline-block">All Doctors</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/about">
              <p className="px-4 py-2 rounded inline-block">About</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/contact">
              <p className="px-4 py-2 rounded inline-block">Contact</p>
            </NavLink>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
