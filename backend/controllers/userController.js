import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import sslcommerz from "sslcommerz";
//import SSLCommerzPayment from "sslcommerz-node";

//API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Please enter all fields" });
    }
    //validating email
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Invalid email address" });
    }
    //validating password length
    if (password.length < 6) {
      return res.json({
        success: false,
        message: "Password must be atleast 6 characters",
      });
    }
    //Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //Saving user to database
    const userData = {
      name,
      email,
      password: hashedPassword,
    };
    const newUser = new userModel(userData);
    const user = await newUser.save();

    //Creating token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//Api for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Does not Exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Wrong Password" });
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//api to get user details
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//API to update user details
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;
    if (!name || !phone || !address || !dob || !gender) {
      return res.json({ success: false, message: "Please enter all fields" });
    }
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });
    if (imageFile) {
      //upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;
      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }
    res.json({ success: true, message: "Profile Updated Successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//API TO BOOK APPOINTMENT
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor is not available" });
    }

    let slots_booked = docData.slots_booked;

    //checking for slots availability
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot is not available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select("-password");

    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // save new slots data in docData

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
//API to get user appointments for frontend my-appointmentpage
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    req.json({ success: false, message: error.message });
  }
};

// API to cancel Appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    // verify appointment user

    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });
    // releasing doctor slot

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: error.message });
  }
};

const sslcommerzInstance = async()=> sslcommerz({
  key_id: process.env.SSL_STORE_ID,
  key_secret: process.env.SSL_STORE_PASSWORD,
});

//Api to make payment sslcommerz
const paymentSslcommerz = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment cancelled or not found",
      });
    }

    //creating options for sslcommerz payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };

    //creation of an order
    const order = await sslcommerzInstance.orders.create(options);

    res.json({ succes: true, order });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment, paymentSslcommerz
};
