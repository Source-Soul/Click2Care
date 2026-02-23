import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";


const Doctors = () => {
  const { speciality } = useParams();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  const { doctors } = useContext(AppContext);

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter((doc) => doc.speciality === speciality));
    } else {
      setFilterDoc(doctors);
    }
  };
  useEffect(() => {
    applyFilter();
  }, [doctors, speciality]);
  return (
    <div>
      <p className="text-gray-600 font-sans text-base leading-relaxed p-4 rounded-lg bg-gray-100 shadow-md transition-all duration-300 hover:bg-gray-200 font-medium">
        Browse through a diverse selection of specialist doctors and find the right expert for your needs
        <span className="inline-flex items-center space-x-1">
          <span> . </span>
          <img src={assets.logo} alt="Logo" className="w-6 h-6 ml-2" />
        </span>
      </p>




      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        <button
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? "bg-primary text-white transition-all" : ""
            }`}
          onClick={() => setShowFilter((prev) => !prev)}
        >
          Filters
        </button>
        <div
          className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? "flex" : "hidden sm:flex"
            }`}
        >

          {/* ............CATEGORY GENERAL PHYSICIAN BUTTON" .......*/}
          <p
            onClick={() =>
              speciality === "General physician"
                ? navigate("/doctors")
                : navigate("/doctors/General physician")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "General physician" ? "bg-emerald-900 text-white border-e-green-800 shadow-lg transform scale-105 hover:bg-green-700 hover:scale-110 active:bg-green-600 relative" : "hover:bg-lime-100"} pl-4 border-l-4 border-green-500 flex items-center`}
          >
            {/* Left Line */}
            <span className="w-1 h-6 bg-green-500 mr-3"></span> {/* Adds a green line on the left */}

            {/* Text */}
            <span className="text-lg text-green-600 font-bold">G</span> {/* Green G */}
            <span className="text-sm">eneral </span> {/* Normal text for "eneral" */}
            <span className="text-sm ml-1">Physician  </span>
          </p>

          {/* ............CATEGORY GYNECOLOGIST BUTTON" .......*/}
          <p
            onClick={() =>
              speciality === "Gynecologist"
                ? navigate("/doctors")
                : navigate("/doctors/Gynecologist")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Gynecologist" ? "bg-emerald-900 text-white border-e-green-800 shadow-lg transform scale-105 hover:bg-green-700 hover:scale-110 active:bg-green-600 relative" : "hover:bg-lime-100"} pl-4 border-l-4 border-green-500 flex items-center`}
          >
            {/* Left Line */}
            <span className="w-1 h-6 bg-green-500 mr-3"></span> {/* Adds a blue line on the left */}

            {/* Text */}
            <span className="text-lg text-green-600 font-bold">G</span> {/* Green G */}
            <span className="text-sm">ynecologist</span> {/* Normal text for "ynecologist" */}
          </p>

          {/* ............CATEGORY DERMATOLOGIST BUTTON" .......*/}
          <p
            onClick={() =>
              speciality === "Dermatologist"
                ? navigate("/doctors")
                : navigate("/doctors/Dermatologist")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Dermatologist" ? "bg-emerald-900 text-white border-e-green-800 shadow-lg transform scale-105 hover:bg-green-700 hover:scale-110 active:bg-green-600 relative" : "hover:bg-lime-100"} pl-4 border-l-4 border-green-500 flex items-center`}
          >
            {/* Left Line */}
            <span className="w-1 h-6 bg-green-500 mr-3"></span> {/* Adds a green line on the left */}

            {/* Text */}
            <span className="text-lg text-green-500 font-bold">D</span> {/* Green D */}
            <span className="text-sm">ermatologist</span> {/* Normal text for "ermatologist" */}
          </p>

{/* ............CATEGORY Pediatrician BUTTON" .......*/}
          <p
            onClick={() =>
              speciality === "Pediatricians"
                ? navigate("/doctors")
                : navigate("/doctors/Pediatricians")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Pediatricians" ? "bg-emerald-900 text-white border-e-green-800 shadow-lg transform scale-105 hover:bg-green-700 hover:scale-110 active:bg-green-600 relative" : "hover:bg-lime-100"} pl-4 border-l-4 border-green-500 flex items-center`}
          >
            {/* Left Line */}
            <span className="w-1 h-6 bg-green-500 mr-3"></span> {/* Adds a green line on the left */}

            {/* Text */}
            <span className="text-lg text-green-600 font-bold">P</span> {/* Green P */}
            <span className="text-sm">ediatricians</span> {/* Normal text for "ediatricians" */}
          </p>

         {/* ............CATEGORY Neurologist  BUTTON" .......*/}
          <p
            onClick={() =>
              speciality === "Neurologist"
                ? navigate("/doctors")
                : navigate("/doctors/Neurologist")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Neurologist" ? "bg-emerald-900 text-white border-e-green-800 shadow-lg transform scale-105 hover:bg-green-700 hover:scale-110 active:bg-green-600 relative" : "hover:bg-lime-100"} pl-4 border-l-4 border-green-500 flex items-center`}
          >
            {/* Left Line */}
            <span className="w-1 h-6 bg-green-500 mr-3"></span> {/* Adds a green line on the left */}

            {/* Text */}
            <span className="text-lg text-green-600 font-bold">N</span> {/* Green N */}
            <span className="text-sm">eurologist</span> {/* Normal text for "eurologist" */}
          </p>

          {/*............CATEGORY Gastroenterologist BUTTON */}
          <p
            onClick={() =>
              speciality === "Gastroenterologist"
                ? navigate("/doctors")
                : navigate("/doctors/Gastroenterologist")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Gastroenterologist" ? "bg-emerald-900 text-white border-e-green-800 shadow-lg transform scale-105 hover:bg-green-700 hover:scale-110 active:bg-green-600 relative" : "hover:bg-lime-100"} pl-4 border-l-4 border-green-500 flex items-center`}
          >
            {/* Left Line */}
            <span className="w-1 h-6 bg-green-500 mr-3"></span> {/* Adds a green line on the left */}

            {/* Text */}
            <span className="text-lg text-green-600 font-bold">G</span> {/* Green G */}
            <span className="text-sm">astroenterologist</span> {/* Normal text for "astroenterologist" */}
          </p>

        </div>
        <div className="w-full grid grid-cols-auto gap-4 gap-y gap-y-6">
          {filterDoc.map((item, index) => (
            <div
              onClick={() => navigate(`/appoinment/${item._id}`)}
              className="border border-green-70 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
              key={index}
            >
              <div>
                <img className="bg-green-50" src={item.image} alt="" />
                <div className="p-4">
                  <div
                    className={`flex items-center gap-2 text-sm text-center ${
                      item.available ? "text-green-500" : "text-gray-500"
                    }`}
                  >
                    <p
                      className={`w-2 h-2 ${
                        item.available ? "bg-green-500" : "bg-gray-500"
                      } rounded-full`}
                    ></p>
                    <p>{item.available ? "Available" : "Not Available"}</p>
                  </div>

                  <p className="text-gray-900 text-lg font-medium">
                    {item.name}
                  </p>
                  <p className="text-gray-600 text-sm">{item.speciality}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
