import axios from "axios";
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { sendNotification } from "../utils/notificationService.js";
import {
  calculateRefund,
  cancelAppointmentWithRefund,
} from "../utils/appointmentService.js";
import crypto from "crypto";

// ==========================================
// Helper Functions
// ==========================================

const parseSlotDateTime = (slotDate, slotTime) => {
  const dateRegex = /^(\d{1,2})_(\d{1,2})_(\d{4})$/;
  const dateMatch = slotDate.match(dateRegex);

  if (!dateMatch) {
    return { error: "Invalid date format" };
  }

  const [, dayStr, monthStr, yearStr] = dateMatch;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  const timeMatch = slotTime
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

  if (!timeMatch) {
    return { error: "Invalid time format" };
  }

  const [, hourStr, minuteStr, meridiemRaw] = timeMatch;
  let hours = Number(hourStr);
  const minutes = Number(minuteStr);
  const meridiem = meridiemRaw ? meridiemRaw.toUpperCase() : null;

  if (minutes < 0 || minutes > 59) {
    return { error: "Invalid time format" };
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return { error: "Invalid time format" };
    }
    if (meridiem === "PM" && hours !== 12) {
      hours += 12;
    }
    if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }
  } else if (hours < 0 || hours > 23) {
    return { error: "Invalid time format" };
  }

  const slotDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return { slotDateTime };
};

const generateMeetingLink = (appointmentId) => {
  const timestamp = Date.now();
  const meetingId = `click2care_${appointmentId}_${timestamp}`;
  return {
    meetingId,
    meetingLink: `https://meet.jitsi.org/${meetingId}`,
  };
};

// ===== OTP Helpers =====
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

// ==========================================
// User Auth & Profile
// ==========================================

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Please enter all fields" });
    }
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Invalid email address" });
    }
    if (password.length < 6) {
      return res.json({
        success: false,
        message: "Password must be atleast 6 characters",
      });
    }

    let user = await userModel.findOne({ email });

    if (user && user.isVerified) {
      return res.json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOtp();
    const hashedOtp = hashCode(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (!user) {
      user = await userModel.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationCode: hashedOtp,
        verificationCodeExpiresAt: otpExpires,
      });
    } else {
      user.password = hashedPassword;
      user.verificationCode = hashedOtp;
      user.verificationCodeExpiresAt = otpExpires;
      await user.save();
    }

    // DEVELOPMENT ONLY: log OTP in console instead of sending email
    console.log("OTP for", email, "is", otp);

    return res.json({
      success: true,
      message:
        "Registration successful. Please enter the OTP shown in the server console.",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.json({ success: false, message: "Email and code required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      return res.json({
        success: false,
        message: "No verification code found, please sign up again.",
      });
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      return res.json({
        success: false,
        message: "Verification code expired, please sign up again.",
      });
    }

    const hashedInput = hashCode(code);
    if (hashedInput !== user.verificationCode) {
      return res.json({ success: false, message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.json({
      success: true,
      message: "Email verified successfully",
      token,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Optional: keep this for future, but for now you can ignore it in frontend.
// It just regenerates OTP and logs it again.
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });
    if (user.isVerified)
      return res.json({ success: false, message: "User already verified" });

    const otp = generateOtp();
    const hashedOtp = hashCode(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = hashedOtp;
    user.verificationCodeExpiresAt = otpExpires;
    await user.save();

    console.log("RESEND OTP for", email, "is", otp);

    res.json({
      success: true,
      message: "Verification code regenerated. Check server console.",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Does not Exist" });
    }

    if (!user.isVerified) {
      return res.json({
        success: false,
        needsVerification: true,
        message: "Please verify your email before logging in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.json({ success: false, message: "Wrong Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.json({ success: true, token, message: "Login successful" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

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

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !address || !dob || !gender) {
      return res.json({ success: false, message: "Please enter all fields" });
    }
    if (!validator.isMobilePhone(phone + "", "any")) {
      return res.json({ success: false, message: "Invalid phone number" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      await userModel.findByIdAndUpdate(userId, {
        image: imageUpload.secure_url,
      });
    }

    res.json({ success: true, message: "Profile Updated Successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// ==========================================
// Appointment Booking (Legacy/Offline Direct)
// ==========================================

const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    if (!userId || !docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const { slotDateTime, error } = parseSlotDateTime(slotDate, slotTime);
    if (error) return res.json({ success: false, message: error });

    if (slotDateTime <= new Date()) {
      return res.json({
        success: false,
        message: "Cannot book past time slots",
      });
    }

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData || !docData.available) {
      return res.json({ success: false, message: "Doctor is not available" });
    }

    let slots_booked = docData.slots_booked;
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot is not available" });
      }
      slots_booked[slotDate].push(slotTime);
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select("-password");
    if (!userData)
      return res.json({ success: false, message: "User not found" });

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
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    const result = await cancelAppointmentWithRefund(appointmentId, "patient");

    if (result.success) {
      await sendNotification({
        type: "cancellation",
        appointment: appointmentData,
        refundInfo: result.refundInfo,
        recipientType: "patient",
        cancelledBy: "patient",
      });

      res.json({
        success: true,
        message: result.message,
        refundInfo: result.refundInfo,
      });
    } else {
      res.json({ success: false, message: result.message });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================================
// Video Consultations
// ==========================================
// (unchanged)

// ==========================================
// Video Consultations
// ==========================================

const initiateVideoConsultation = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available)
      return res.json({ success: false, message: "Doctor is not available" });

    let slots_booked = docData.slots_booked;
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
      appointmentType: "video",
      isVideo: true,
      videoConsultationData: {
        patientName: "",
        patientEmail: "",
        patientPhone: "",
        meetingLink: "",
        meetingId: "",
      },
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({
      success: true,
      message: "Video consultation slot booked.",
      appointmentId: newAppointment._id,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const createVideoConsultation = async (req, res) => {
  try {
    const {
      userId,
      docId,
      slotDate,
      slotTime,
      patientName,
      patientEmail,
      patientPhone,
    } = req.body;

    if (!docId || !slotDate || !slotTime)
      return res.json({
        success: false,
        message: "Missing required booking details",
      });
    if (!patientName || !patientEmail || !patientPhone)
      return res.json({ success: false, message: "Missing patient details" });

    const { slotDateTime, error } = parseSlotDateTime(slotDate, slotTime);
    if (error) return res.json({ success: false, message: error });
    if (slotDateTime <= new Date())
      return res.json({
        success: false,
        message: "Cannot book past time slots",
      });

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData || !docData.available)
      return res.json({ success: false, message: "Doctor is not available" });

    let slots_booked = docData.slots_booked || {};
    const slotIsBooked =
      slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime);
    if (slotIsBooked)
      return res.json({
        success: false,
        message: "Slot is no longer available.",
      });

    const userData = await userModel.findById(userId).select("-password");
    if (!userData)
      return res.json({ success: false, message: "User not found" });

    delete docData.slots_booked;
    const appointmentIdTemp = new appointmentModel({})._id;
    const { meetingLink, meetingId } = generateMeetingLink(appointmentIdTemp);

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
      appointmentType: "video",
      isVideo: true,
      payment: true,
      videoConsultationData: {
        patientName,
        patientEmail,
        patientPhone,
        meetingLink,
        meetingId,
      },
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    const finalMeetingLink = `https://meet.jitsi.org/click2care_${
      newAppointment._id
    }_${Date.now()}`;
    newAppointment.videoConsultationData.meetingLink = finalMeetingLink;
    await newAppointment.save();

    if (slots_booked[slotDate]) {
      slots_booked[slotDate].push(slotTime);
    } else {
      slots_booked[slotDate] = [slotTime];
    }
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    await sendNotification({
      type: "confirmation",
      appointment: newAppointment,
      recipientType: "patient",
    });

    res.json({
      success: true,
      message: "Video consultation confirmed successfully!",
      appointmentId: newAppointment._id,
      meetingLink: finalMeetingLink,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error.message || "Failed to create video consultation",
    });
  }
};

const confirmVideoConsultation = async (req, res) => {
  try {
    const { appointmentId, patientName, patientEmail, patientPhone } = req.body;
    if (!patientName || !patientEmail || !patientPhone)
      return res.json({
        success: false,
        message: "Please provide all required details",
      });
    if (!validator.isEmail(patientEmail))
      return res.json({ success: false, message: "Invalid email address" });

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    const { meetingId, meetingLink } = generateMeetingLink(appointmentId);

    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        "videoConsultationData.patientName": patientName,
        "videoConsultationData.patientEmail": patientEmail,
        "videoConsultationData.patientPhone": patientPhone,
        "videoConsultationData.meetingLink": meetingLink,
        "videoConsultationData.meetingId": meetingId,
        payment: true,
      },
      { new: true }
    );

    await sendNotification({
      type: "confirmation",
      appointment: updatedAppointment,
      recipientType: "patient",
    });
    await sendNotification({
      type: "confirmation",
      appointment: updatedAppointment,
      recipientType: "doctor",
    });

    res.json({
      success: true,
      message: "Video consultation confirmed",
      meetingLink,
      appointmentId,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });
    res.json({ success: true, appointment });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const markAppointmentJoined = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      joinedAt: Date.now(),
      noShow: false,
    });
    res.json({ success: true, message: "Marked as joined" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const markAppointmentLeft = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      leftAt: Date.now(),
      isCompleted: true,
    });
    res.json({ success: true, message: "Marked as left" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const markAppointmentCompleted = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { isCompleted: true, completedAt: Date.now() },
      { new: true }
    );

    await sendNotification({
      userId: appointment.userId,
      docId: appointment.docId,
      appointmentId: appointmentId,
      notificationType: "consultation_completed",
      data: {
        docName: appointment.docData.name,
        date: appointment.slotDate,
        time: appointment.slotTime,
      },
    });

    res.json({
      success: true,
      message: "Appointment marked as completed",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const checkAndMarkNoShow = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    if (!appointment.joinedAt) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { noShow: true });
      await sendNotification({
        userId: appointment.userId,
        docId: appointment.docId,
        appointmentId: appointmentId,
        notificationType: "patient_no_show",
        data: {
          patientName: appointment.userData.name,
          date: appointment.slotDate,
          time: appointment.slotTime,
        },
      });
      return res.json({
        success: true,
        message: "Patient marked as no-show",
        isNoShow: true,
      });
    }
    return res.json({
      success: true,
      message: "Patient joined the meeting",
      isNoShow: false,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const validateMeetingJoin = async (req, res) => {
  try {
    const { appointmentId, userId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    const isAuthorized =
      appointment.userId === userId || appointment.docId === userId;
    if (!isAuthorized)
      return res.json({
        success: false,
        message: "Unauthorized to join this meeting",
      });
    if (appointment.cancelled)
      return res.json({
        success: false,
        message: "This appointment has been cancelled",
      });

    const [day, month, year] = appointment.slotDate.split("_").map(Number);
    const [hours, minutes] = appointment.slotTime.split(":").map(Number);
    const appointmentTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    const timeDiffMinutes = (appointmentTime - now) / (1000 * 60);

    if (timeDiffMinutes > 5)
      return res.json({
        success: false,
        message: "Meeting has not started yet",
        status: "not-started",
        minutesUntilStart: Math.ceil(timeDiffMinutes),
      });
    if (timeDiffMinutes < -30)
      return res.json({
        success: false,
        message: "Meeting expired - 30+ minutes past scheduled time",
        status: "expired",
      });

    res.json({
      success: true,
      message: "Meeting is available to join",
      status: "active",
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// ==========================================
// SSLCommerz Payment Gateway Integration
// ==========================================

const initiatePayment = async (req, res) => {
  try {
    const {
      userId,
      docId,
      slotDate,
      slotTime,
      appointmentType,
      patientName,
      patientEmail,
      patientPhone,
    } = req.body;

    if (!docId || !slotDate || !slotTime)
      return res.json({
        success: false,
        message: "Missing required booking details",
      });

    const { slotDateTime, error } = parseSlotDateTime(slotDate, slotTime);
    if (error) return res.json({ success: false, message: error });
    if (slotDateTime <= new Date())
      return res.json({
        success: false,
        message: "Cannot book past time slots",
      });

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData || !docData.available)
      return res.json({ success: false, message: "Doctor not available" });

    let slots_booked = docData.slots_booked || {};
    if (slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime)) {
      return res.json({
        success: false,
        message: "Slot is no longer available",
      });
    }

    const userData = await userModel.findById(userId).select("-password");
    if (!userData)
      return res.json({ success: false, message: "User not found" });

    const amount = docData.fees;

    // Reserve Slot
    if (slots_booked[slotDate]) {
      slots_booked[slotDate].push(slotTime);
    } else {
      slots_booked[slotDate] = [slotTime];
    }
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    const tran_id = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const safeDocData = { ...docData.toObject() };
    delete safeDocData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData: safeDocData,
      amount,
      slotTime,
      slotDate,
      date: Date.now(),
      appointmentType: appointmentType || "offline",
      paymentStatus: "Pending",
      transactionId: tran_id,
    };

    if (appointmentType === "video") {
      appointmentData.isVideo = true;
      appointmentData.videoConsultationData = {
        patientName,
        patientEmail,
        patientPhone,
        meetingLink: "",
        meetingId: "",
      };
    }

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    const paymentData = {
      store_id: process.env.SSL_STORE_ID,
      store_passwd: process.env.SSL_STORE_PASSWORD,
      total_amount: amount,
      currency: process.env.CURRENCY || "BDT",
      tran_id: tran_id,
      success_url: `${process.env.BACKEND_URL}/api/user/payment/success/${tran_id}`,
      fail_url: `${process.env.BACKEND_URL}/api/user/payment/fail/${tran_id}`,
      cancel_url: `${process.env.BACKEND_URL}/api/user/payment/cancel/${tran_id}`,
      ipn_url: `${process.env.BACKEND_URL}/api/user/payment/ipn`,
      shipping_method: "No",
      product_name: `${appointmentType} Consultation`,
      product_category: "Medical Service",
      product_profile: "general",
      cus_name: patientName || userData.name,
      cus_email: patientEmail || userData.email,
      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: patientPhone || userData.phone,
    };

    const sslUrl = `${process.env.SSL_BASE_URL}${process.env.SSL_INIT_API}`;
    const response = await axios({
      method: "post",
      url: sslUrl,
      data: paymentData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.data && response.data.status === "SUCCESS") {
      return res.json({ success: true, url: response.data.GatewayPageURL });
    } else {
      // Rollback
      await appointmentModel.findByIdAndDelete(newAppointment._id);
      slots_booked[slotDate] = slots_booked[slotDate].filter(
        (t) => t !== slotTime
      );
      await doctorModel.findByIdAndUpdate(docId, { slots_booked });
      return res.json({
        success: false,
        message: "Failed to initiate payment gateway",
      });
    }
  } catch (error) {
    console.log("Payment Initiation Error: ", error);
    res.json({ success: false, message: error.message });
  }
};

const retryPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment || appointment.payment) {
      return res.json({
        success: false,
        message: "Invalid or already paid appointment",
      });
    }

    const new_tran_id = `TXN-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;
    appointment.transactionId = new_tran_id;
    await appointment.save();

    const paymentData = {
      store_id: process.env.SSL_STORE_ID,
      store_passwd: process.env.SSL_STORE_PASSWORD,
      total_amount: appointment.amount,
      currency: process.env.CURRENCY || "BDT",
      tran_id: new_tran_id,
      success_url: `${process.env.BACKEND_URL}/api/user/payment/success/${new_tran_id}`,
      fail_url: `${process.env.BACKEND_URL}/api/user/payment/fail/${new_tran_id}`,
      cancel_url: `${process.env.BACKEND_URL}/api/user/payment/cancel/${new_tran_id}`,
      ipn_url: `${process.env.BACKEND_URL}/api/user/payment/ipn`,
      shipping_method: "No",
      product_name: `${appointment.appointmentType} Consultation`,
      product_category: "Medical",
      product_profile: "general",
      cus_name: appointment.userData.name,
      cus_email: appointment.userData.email,
      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: appointment.userData.phone,
    };

    const sslUrl = `${process.env.SSL_BASE_URL}${process.env.SSL_INIT_API}`;
    const response = await axios({
      method: "post",
      url: sslUrl,
      data: paymentData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.data && response.data.status === "SUCCESS") {
      return res.json({ success: true, url: response.data.GatewayPageURL });
    } else {
      return res.json({ success: false, message: "SSL Gateway failed" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const paymentSuccess = async (req, res) => {
  try {
    // Safely extract tran_id from either params (URL) or body
    const tran_id = req.params.tran_id || req.body.tran_id;

    // Find document by custom field, not standard _id
    const appointment = await appointmentModel.findOneAndUpdate(
      { transactionId: tran_id },
      { payment: true, paymentStatus: "Success" },
      { new: true }
    );

    if (!appointment) {
      console.log("Appointment not found for TXN:", tran_id);
      return res.redirect(`${process.env.FRONTEND_URL}/my-appointments`);
    }

    if (appointment.isVideo) {
      const { meetingId, meetingLink } = generateMeetingLink(appointment._id);
      appointment.videoConsultationData =
        appointment.videoConsultationData || {};
      appointment.videoConsultationData.meetingId = meetingId;
      appointment.videoConsultationData.meetingLink = meetingLink;
      // Critical Mongoose Step for nested Objects:
      appointment.markModified("videoConsultationData");
      await appointment.save();
    }

    res.redirect(`${process.env.FRONTEND_URL}/my-appointments`);
  } catch (error) {
    console.log("Payment Success Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/my-appointments`);
  }
};

const paymentFail = async (req, res) => {
  try {
    const tran_id = req.params.tran_id || req.body.tran_id;
    await appointmentModel.findOneAndUpdate(
      { transactionId: tran_id },
      { paymentStatus: "Failed" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/my-appointments`);
  } catch (error) {
    console.log("Payment Fail Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/my-appointments`);
  }
};

const paymentCancel = async (req, res) => {
  try {
    const tran_id = req.params.tran_id || req.body.tran_id;
    await appointmentModel.findOneAndUpdate(
      { transactionId: tran_id },
      { paymentStatus: "Cancelled" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/my-appointments`);
  } catch (error) {
    console.log("Payment Cancel Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/my-appointments`);
  }
};

const paymentIpn = async (req, res) => {
  console.log("IPN Triggered:", req.body);
  return res.status(200).json({ message: "IPN Received" });
};

// ==========================================
// Exports
// ==========================================

export {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
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
  initiatePayment,
  retryPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIpn,
};

