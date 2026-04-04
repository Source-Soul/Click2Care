/*import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { sendNotification } from "../utils/notificationService.js";
import { cancelAppointmentWithRefund } from "../utils/appointmentService.js";
import twilio from "twilio";

// Twilio Setup
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// --- HELPER FUNCTIONS ---
const parseSlotDateTime = (slotDate, slotTime) => {
  const dateRegex = /^(\d{1,2})_(\d{1,2})_(\d{4})$/;
  const dateMatch = slotDate.match(dateRegex);
  if (!dateMatch) return { error: "Invalid date format" };

  const [, day, month, year] = dateMatch;
  const timeMatch = slotTime
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!timeMatch) return { error: "Invalid time format" };

  const [, hourStr, minuteStr, meridiem] = timeMatch;
  let hours = Number(hourStr);
  if (meridiem?.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;

  return {
    slotDateTime: new Date(year, month - 1, day, hours, Number(minuteStr)),
  };
};

const generateMeetingLink = (appointmentId) => {
  const meetingId = `click2care_${appointmentId}_${Date.now()}`;
  return { meetingId, meetingLink: `https://meet.jitsi.org/${meetingId}` };
};

// --- CONTROLLER FUNCTIONS ---

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.json({ success: false, message: "Missing fields" });
    if (!validator.isEmail(email))
      return res.json({ success: false, message: "Invalid email" });
    if (password.length < 6)
      return res.json({ success: false, message: "Password too short" });

    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10),
    );
    const user = await new userModel({
      name,
      email,
      password: hashedPassword,
    }).save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      return res.json({
        success: true,
        token,
        isProfileComplete: user.isProfileComplete,
      });
    }
    res.json({ success: false, message: "Wrong password" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// OTP & Profile Functions
const sendOTP = async (req, res) => {
  try {
    const { userId, phone } = req.body;
    if (!phone) return res.json({ success: false, message: "Phone required" });
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await userModel.findByIdAndUpdate(userId, { otp, otpExpires });
    await client.messages.create({
      body: `Your Click2Care code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    res.json({ success: true, message: "OTP sent!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const completeProfileSetup = async (req, res) => {
  try {
    const { userId, name, age, phone, otp } = req.body;
    const user = await userModel.findById(userId);
    if (!user || user.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });
    if (new Date() > user.otpExpires)
      return res.json({ success: false, message: "OTP Expired" });

    await userModel.findByIdAndUpdate(userId, {
      name,
      age: Number(age),
      phone,
      isProfileComplete: true,
      otp: null,
      otpExpires: null,
    });
    res.json({ success: true, message: "Setup Complete!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userData = await userModel
      .findById(req.body.userId)
      .select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });
    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });
      await userModel.findByIdAndUpdate(userId, { image: upload.secure_url });
    }
    res.json({ success: true, message: "Updated!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const { slotDateTime, error } = parseSlotDateTime(slotDate, slotTime);
    if (error) return res.json({ success: false, message: error });

    const docData = await doctorModel.findById(docId);
    if (docData.slots_booked[slotDate]?.includes(slotTime))
      return res.json({ success: false, message: "Slot taken" });

    let slots = docData.slots_booked;
    slots[slotDate] = slots[slotDate]
      ? [...slots[slotDate], slotTime]
      : [slotTime];

    const userData = await userModel.findById(userId).select("-password");
    await new appointmentModel({
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    }).save();
    await doctorModel.findByIdAndUpdate(docId, { slots_booked: slots });
    res.json({ success: true, message: "Booked!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const listAppointment = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.json({ success: true, appointments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const result = await cancelAppointmentWithRefund(appointmentId, "patient");
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Video Consultation APIs
const initiateVideoConsultation = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId);
    const appointment = await new appointmentModel({
      userId,
      docId,
      docData,
      slotDate,
      slotTime,
      isVideo: true,
    }).save();
    res.json({ success: true, appointmentId: appointment._id });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const createVideoConsultation = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const { meetingLink, meetingId } = generateMeetingLink(appointmentId);
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      "videoConsultationData.meetingLink": meetingLink,
      "videoConsultationData.meetingId": meetingId,
    });
    res.json({ success: true, meetingLink });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const confirmVideoConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
    res.json({ success: true, message: "Confirmed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getAppointmentDetails = async (req, res) => {
  try {
    const appointment = await appointmentModel.findById(req.body.appointmentId);
    res.json({ success: true, appointment });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const validateMeetingJoin = async (req, res) => {
  res.json({ success: true, status: "active" });
};

const markAppointmentJoined = async (req, res) => {
  await appointmentModel.findByIdAndUpdate(req.body.appointmentId, {
    joinedAt: Date.now(),
  });
  res.json({ success: true });
};

const markAppointmentLeft = async (req, res) => {
  await appointmentModel.findByIdAndUpdate(req.body.appointmentId, {
    leftAt: Date.now(),
    isCompleted: true,
  });
  res.json({ success: true });
};

const markAppointmentCompleted = async (req, res) => {
  await appointmentModel.findByIdAndUpdate(req.body.appointmentId, {
    isCompleted: true,
  });
  res.json({ success: true });
};

const checkAndMarkNoShow = async (req, res) => {
  res.json({ success: true });
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  initiateVideoConsultation,
  createVideoConsultation,
  confirmVideoConsultation,
  getAppointmentDetails,
  validateMeetingJoin,
  markAppointmentJoined,
  markAppointmentLeft,
  markAppointmentCompleted,
  checkAndMarkNoShow,
  completeProfileSetup,
  sendOTP,
};
*/
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { sendNotification } from "../utils/notificationService.js";
import { cancelAppointmentWithRefund } from "../utils/appointmentService.js";
import twilio from "twilio";

// Twilio Setup
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// --- HELPER FUNCTIONS ---
const parseSlotDateTime = (slotDate, slotTime) => {
  const dateRegex = /^(\d{1,2})_(\d{1,2})_(\d{4})$/;
  const dateMatch = slotDate.match(dateRegex);
  if (!dateMatch) return { error: "Invalid date format" };

  const [, day, month, year] = dateMatch;
  const timeMatch = slotTime
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!timeMatch) return { error: "Invalid time format" };

  const [, hourStr, minuteStr, meridiem] = timeMatch;
  let hours = Number(hourStr);
  if (meridiem?.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;

  return {
    slotDateTime: new Date(year, month - 1, day, hours, Number(minuteStr)),
  };
};

const generateMeetingLink = (appointmentId) => {
  const meetingId = `click2care_${appointmentId}_${Date.now()}`;
  return { meetingId, meetingLink: `https://meet.jitsi.org/${meetingId}` };
};

// --- CONTROLLER FUNCTIONS ---

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.json({ success: false, message: "Missing fields" });
    if (!validator.isEmail(email))
      return res.json({ success: false, message: "Invalid email" });
    if (password.length < 6)
      return res.json({ success: false, message: "Password too short" });

    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10),
    );
    const user = await new userModel({
      name,
      email,
      password: hashedPassword,
    }).save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      return res.json({
        success: true,
        token,
        isProfileComplete: user.isProfileComplete,
      });
    }
    res.json({ success: false, message: "Wrong password" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// OTP & Profile Functions
const sendOTP = async (req, res) => {
  try {
    const { userId, phone } = req.body;
    if (!phone) return res.json({ success: false, message: "Phone required" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Terminal-e OTP print kora jate apni dekhte paren
    console.log("================================");
    console.log(`OTP for ${phone} is: ${otp}`);
    console.log("================================");

    await userModel.findByIdAndUpdate(userId, { otp, otpExpires });

    await client.messages.create({
      body: `Your Click2Care code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    res.json({ success: true, message: "OTP sent!" });
  } catch (error) {
    console.error("Twilio Error:", error.message);
    res.json({ success: false, message: "Twilio Error: " + error.message });
  }
};

const completeProfileSetup = async (req, res) => {
  try {
    const { userId, name, age, phone, otp } = req.body;
    const user = await userModel.findById(userId);
    if (!user || user.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });
    if (new Date() > user.otpExpires)
      return res.json({ success: false, message: "OTP Expired" });

    await userModel.findByIdAndUpdate(userId, {
      name,
      age: Number(age),
      phone,
      isProfileComplete: true,
      otp: null,
      otpExpires: null,
    });
    res.json({ success: true, message: "Setup Complete!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userData = await userModel
      .findById(req.body.userId)
      .select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });
    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });
      await userModel.findByIdAndUpdate(userId, { image: upload.secure_url });
    }
    res.json({ success: true, message: "Updated!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const { slotDateTime, error } = parseSlotDateTime(slotDate, slotTime);
    if (error) return res.json({ success: false, message: error });

    const docData = await doctorModel.findById(docId);
    if (docData.slots_booked[slotDate]?.includes(slotTime))
      return res.json({ success: false, message: "Slot taken" });

    let slots = docData.slots_booked;
    slots[slotDate] = slots[slotDate]
      ? [...slots[slotDate], slotTime]
      : [slotTime];

    const userData = await userModel.findById(userId).select("-password");
    await new appointmentModel({
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    }).save();
    await doctorModel.findByIdAndUpdate(docId, { slots_booked: slots });
    res.json({ success: true, message: "Booked!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const listAppointment = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.json({ success: true, appointments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const result = await cancelAppointmentWithRefund(appointmentId, "patient");
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const initiateVideoConsultation = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId);
    const appointment = await new appointmentModel({
      userId,
      docId,
      docData,
      slotDate,
      slotTime,
      isVideo: true,
    }).save();
    res.json({ success: true, appointmentId: appointment._id });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const createVideoConsultation = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const { meetingLink, meetingId } = generateMeetingLink(appointmentId);
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      "videoConsultationData.meetingLink": meetingLink,
      "videoConsultationData.meetingId": meetingId,
    });
    res.json({ success: true, meetingLink });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const confirmVideoConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
    res.json({ success: true, message: "Confirmed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getAppointmentDetails = async (req, res) => {
  try {
    const appointment = await appointmentModel.findById(req.body.appointmentId);
    res.json({ success: true, appointment });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const validateMeetingJoin = async (req, res) => {
  res.json({ success: true, status: "active" });
};

const markAppointmentJoined = async (req, res) => {
  await appointmentModel.findByIdAndUpdate(req.body.appointmentId, {
    joinedAt: Date.now(),
  });
  res.json({ success: true });
};

const markAppointmentLeft = async (req, res) => {
  await appointmentModel.findByIdAndUpdate(req.body.appointmentId, {
    leftAt: Date.now(),
    isCompleted: true,
  });
  res.json({ success: true });
};

const markAppointmentCompleted = async (req, res) => {
  await appointmentModel.findByIdAndUpdate(req.body.appointmentId, {
    isCompleted: true,
  });
  res.json({ success: true });
};

const checkAndMarkNoShow = async (req, res) => {
  res.json({ success: true });
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  initiateVideoConsultation,
  createVideoConsultation,
  confirmVideoConsultation,
  getAppointmentDetails,
  validateMeetingJoin,
  markAppointmentJoined,
  markAppointmentLeft,
  markAppointmentCompleted,
  checkAndMarkNoShow,
  completeProfileSetup,
  sendOTP,
};
