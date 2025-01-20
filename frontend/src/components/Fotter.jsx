import React from "react";
import { assets } from "../assets/assets";

const Fotter = () => {
  return (
    <div className="md:mx-10">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        {/*---------left section------*/}
        <div>
          <img className="mb-5 w-40" src={assets.logo} alt="" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur
            cupiditate libero blanditiis ad consectetur non mollitia modi sint
            volup!
          </p>
        </div>
        {/*---------center section------*/}
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-2">
            <li>Home</li>
            <li>About Us</li>
            <li>Contact Us</li>
            <li>Privact Policy</li>
          </ul>
        </div>
        {/*---------right section------*/}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2">
            <li>+10620</li>
            <li>click2Care@gmail.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Fotter;
