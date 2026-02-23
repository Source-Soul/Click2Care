import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const RelatedDoctors = ({speciality, docId}) => {
    const {doctors}=useContext(AppContext)
    const navigate=useNavigate()

    const [relDoc,setRelDocs]= useState([])

    useEffect(()=>{
        if(doctors.length > 0 && speciality){
            const doctorsData =doctors.filter((doc)=> doc.speciality === speciality && doc._id !== docId)
            setRelDocs(doctorsData)
        }

   },[doctors,speciality,docId])

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
     <div className="w-24 h-1 bg-lime-500 rounded-full"></div>
    <h1 className="text-3xl font-medium text-green-900">Related Doctors To Book</h1>
    <p className="sm:w-1/3 text-center text-sm">
    Easily explore our wide range of trusted doctors.
    </p>
    <div className="w-24 h-1 bg-lime-500 rounded-full"></div>

    <div className="w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0">
      {relDoc.slice(0, 5).map((item, index) => (
        <div
          onClick={() => {navigate(`/appoinment/${item._id}`); scrollTo(0,0) }}
          className="border border-green-70 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
          key={index}
        >
          <div>
            <img className="bg-lime-950" src={item.image} alt="" />
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

              <p className="text-gray-900 text-lg font-medium">{item.name}</p>
              <p className="text-gray-600 text-sm">{item.speciality}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
    <button
        onClick={() => {
          navigate("/doctors");
          scrollTo(0, 0);
        }}
        className="bg-green-700 text-white font-semibold px-12 py-3 rounded-full mt-10 hover:bg-green-600 hover:shadow-xl hover:scale-105 hover:shadow-green-500/50 transition-all duration-300 ease-in-out"
      >
        More
      </button>
  </div>
  )
}

export default RelatedDoctors