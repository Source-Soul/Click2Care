import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ProfileSetup = () => {
  const { backendUrl, token, loadUserProfileData } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address1: "",
    address2: "",
    bloodGroup: "", // Notun field
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/update-profile",
        {
          name: formData.name,
          phone: formData.phone,
          bloodGroup: formData.bloodGroup, // Data pathano hocche
          address: JSON.stringify({
            line1: formData.address1,
            line2: formData.address2,
          }),
          gender: "Not Selected",
          dob: "0000-00-00",
        },
        { headers: { token } },
      );

      if (data.success) {
        toast.success("Profile Setup Completed!");
        await loadUserProfileData();
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form
        onSubmit={handleUpdate}
        className="bg-white p-8 rounded-xl shadow-lg border w-full max-w-md flex flex-col gap-4"
      >
        <p className="text-2xl font-semibold">Profile Setup</p>

        <div>
          <p>Full Name</p>
          <input
            className="border w-full p-2 rounded mt-1"
            type="text"
            required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            value={formData.name}
          />
        </div>

        <div>
          <p>Mobile Number</p>
          <input
            className="border w-full p-2 rounded mt-1"
            type="text"
            required
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            value={formData.phone}
          />
        </div>

        <div>
          <p>Blood Group</p>
          <select
            className="border w-full p-2 rounded mt-1"
            required
            onChange={(e) =>
              setFormData({ ...formData, bloodGroup: e.target.value })
            }
            value={formData.bloodGroup}
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>

        <div>
          <p>Address Line 1</p>
          <input
            className="border w-full p-2 rounded mt-1"
            type="text"
            required
            onChange={(e) =>
              setFormData({ ...formData, address1: e.target.value })
            }
            value={formData.address1}
          />
        </div>

        <div>
          <p>Address Line 2</p>
          <input
            className="border w-full p-2 rounded mt-1"
            type="text"
            required
            onChange={(e) =>
              setFormData({ ...formData, address2: e.target.value })
            }
            value={formData.address2}
          />
        </div>

        <button type="submit" className="bg-primary text-white py-2 rounded-md">
          Continue to Home
        </button>
      </form>
    </div>
  );
};

export default ProfileSetup;
//updated
