import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } =
    useContext(AppContext);
  const [image, setImage] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const updateUserProfileData = async () => {
    try {
      // ✅ Validation: ensure all fields are filled
      if (
        !userData.name ||
        !userData.phone ||
        !userData.address?.line1 ||
        !userData.address?.line2 ||
        !userData.dob ||
        !userData.gender
      ) {
        toast.error("Please fill all fields!");
        return;
      }

      // ✅ Frontend phone validation
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(userData.phone)) {
        toast.error("Enter a valid Bangladeshi phone number");
        return;
      }

      const formData = new FormData();
      formData.append("name", userData.name);
      formData.append("phone", userData.phone);
      formData.append("address", JSON.stringify(userData.address));
      formData.append("dob", userData.dob);
      formData.append("gender", userData.gender);

      if (image) formData.append("image", image);

      const { data } = await axios.post(
        `${backendUrl}/api/user/update-profile`,
        formData,
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message);
        await loadUserProfileData();
        setIsEdit(false);
        setImage(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    userData && (
      <div className="max-w-lg flex flex-col gap-2 text-sm">
        {/* Profile Image */}
        {isEdit ? (
          <label htmlFor="image">
            <div className="inline-block relative cursor-pointer">
              <img
                className="w-36 rounded opacity-75"
                src={image ? URL.createObjectURL(image) : userData.image}
                alt="User"
              />
              <img
                className="w-10 absolute bottom-12 right-12"
                src={image ? "" : assets.upload_icon}
                alt="Upload"
              />
            </div>
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id="image"
              hidden
            />
          </label>
        ) : (
          <img
            className="w-36 rounded"
            src={userData.image}
            alt="User Profile"
          />
        )}

        {/* Name */}
        {isEdit ? (
          <input
            className="bg-gray-50 text-3xl font-medium max-w-60 mt-4"
            type="text"
            value={userData.name}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        ) : (
          <p className="font-medium text-3xl text-natural-800 mt-4">
            {userData.name}
          </p>
        )}

        <hr className="bc-zinc-400 h-[1px] border-none" />

        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
          {/* Email */}
          <p className="font-medium">Email ID:</p>
          <p className="text-green-500">{userData.email}</p>

          {/* Phone */}
          <p className="font-medium">Contact Number:</p>
          {isEdit ? (
            <input
              className="bg-gray-100 max-w-52"
              type="tel"
              placeholder="Enter valid phone number"
              pattern="01[3-9]{1}[0-9]{8}"
              value={userData.phone}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          ) : (
            <p className="text-green-400">{userData.phone}</p>
          )}

          {/* Address */}
          <p className="font-medium">Address:</p>
          {isEdit ? (
            <div>
              <input
                className="bg-gray-50 w-full"
                type="text"
                value={userData.address.line1}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line1: e.target.value },
                  }))
                }
              />
              <input
                className="bg-gray-50 w-full mt-1"
                type="text"
                value={userData.address.line2}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line2: e.target.value },
                  }))
                }
              />
            </div>
          ) : (
            <p className="text-gray-500">
              {userData.address.line1}
              <br />
              {userData.address.line2}
            </p>
          )}

          {/* Gender */}
          <p className="font-medium">Gender:</p>
          {isEdit ? (
            <select
              className="max-w-20 bg-gray-100"
              value={userData.gender}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, gender: e.target.value }))
              }
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <p className="text-gray-400">{userData.gender}</p>
          )}

          {/* Birth Date */}
          <p className="font-medium">Birth Date:</p>
          {isEdit ? (
            <input
              className="max-w-28 bg-gray-100"
              type="date"
              value={userData.dob}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, dob: e.target.value }))
              }
            />
          ) : (
            <p className="text-gray-400">{userData.dob}</p>
          )}
        </div>

        {/* Edit / Save Button */}
        <div className="mt-10">
          {isEdit ? (
            <button
              className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
              onClick={updateUserProfileData}
            >
              Save Information
            </button>
          ) : (
            <button
              className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
              onClick={() => setIsEdit(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    )
  );
};

export default MyProfile;
