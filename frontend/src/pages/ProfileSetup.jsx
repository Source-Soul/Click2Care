import React from "react";

const ProfileSetup = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold mb-4">Complete Your Profile</h2>
      <form className="flex flex-col gap-3 w-full max-w-md bg-white p-8 shadow-lg rounded-lg">
        <input
          className="border rounded p-2"
          type="text"
          placeholder="Full Name"
          required
        />
        <input
          className="border rounded p-2"
          type="number"
          placeholder="Age"
          required
        />
        <div className="flex gap-2">
          <input
            className="border rounded p-2 flex-1"
            type="text"
            placeholder="Mobile Number"
            required
          />
          <button
            className="bg-primary text-white px-4 py-2 rounded text-sm"
            type="button"
          >
            Send OTP
          </button>
        </div>
        <input
          className="border rounded p-2"
          type="text"
          placeholder="Enter OTP"
          required
        />
        <button
          className="bg-primary text-white py-2 rounded font-medium"
          type="submit"
        >
          Verify & Save
        </button>
      </form>
    </div>
  );
};

export default ProfileSetup; // এই লাইনটি অত্যন্ত জরুরি
