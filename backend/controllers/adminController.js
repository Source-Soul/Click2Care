import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js";


// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add doctor

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }
    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }
    //validating strong password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    //hashing doctor password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set default image URL if no image is provided
    let imageUrl = "https://via.placeholder.com/150"; // Default image placeholder URL
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      imageUrl = imageUpload.secure_url;
      console.log("Image uploaded to Cloudinary:", imageUrl);
    } else {
      console.log("No image file provided. Using default image URL.");
    }

    // Parsing address

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: "Doctor Added Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Internal Server Error" });
  }
};

//api for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, message: "Login Successful", token });
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Internal Server Error" });
  }
};

// API for getting all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Internal Server Error" });
  }
};

//Api to get all appointments list
const appointmentsAdmin = async (req,res)=> {

  try{
    const appointments = await appointmentModel.find({}).select("-password");                                                                                                              
    res.json({success:true,appointments})
  }catch(error){
    console.log(error)
    res.json({success:false,message:error.message})
  }
}

//Api for appointment cancellation
const appointmentCancel = async (req, res) => {

  try {
  
      const { appointmentId} = req.body
      const appointmentData = await appointmentModel.findById(appointmentId)
  
 
  await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
  // releasing doctor slot

    const {docId, slotDate, slotTime} = appointmentData
    const doctorData = await doctorModel.findById(docId)
    let slots_booked = doctorData.slots_booked
    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)
    await doctorModel.findByIdAndUpdate(docId,{slots_booked})
    res.json({success: true, message:'Appointment Cancelled'})
  
  } catch (error) {
  
      console.log(error);
  
      res.json({ success: false, message: error.message });
  
  }
}
// API TO GET DASHBOARD DATA FOR ADMIN PANEL

const adminDashboard = async (req,res)=>
  {try {
    const doctors = await doctorModel.find({})
    const users =await userModel.find({})
    const appointments =await appointmentModel.find({})
  
    const dashData ={
      doctors: doctors.length,
      appointments:appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0,5)
    }
  
    res.json({success:true, dashData})
  
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Internal Server Error" });
  }
  
  }

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel,adminDashboard };
