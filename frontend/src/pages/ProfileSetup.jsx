import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const ProfileSetup = () => {
  const { backendUrl, token, setUserData } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    otp: "",
  });

  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendOtp = async () => {
    // OTP pathanor backend API call ekhane hobe
    toast.info("OTP sent to your mobile!");
    setIsOtpSent(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ekhane backend API call hobe profile update korar jonno
      const { data } = await axios.post(
        backendUrl + "/api/user/complete-profile",
        formData,
        { headers: { token } },
      );

      if (data.success) {
        toast.success("Profile Setup Complete!");
        setUserData(data.user); // Context update
        navigate("/"); // Redirect to Home
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md border w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Complete Your Profile
        </h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Please provide your details to continue
        </p>

        <div className="space-y-4">
          <input
            name="name"
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            type="text"
            placeholder="Full Name"
            required
          />
          <input
            name="age"
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            type="number"
            placeholder="Age"
            required
          />
          <input
            name="phone"
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            type="tel"
            placeholder="Mobile Number"
            required
          />

          {!isOtpSent ? (
            <button
              type="button"
              onClick={sendOtp}
              className="w-full bg-primary text-white py-2 rounded hover:bg-opacity-90"
            >
              Send OTP
            </button>
          ) : (
            <>
              <input
                name="otp"
                onChange={handleInputChange}
                className="w-full p-2 border rounded border-green-500"
                type="text"
                placeholder="Enter OTP"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded"
              >
                Verify & Finish
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;
