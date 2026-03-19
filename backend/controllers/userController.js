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
//import sslcommerz from 'sslcommerz'

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

  // Supports both "2:30 PM" and "14:30" formats.
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

    // check empty fields
    if (!name || !phone || !address || !dob || !gender) {
      return res.json({
        success: false,
        message: "Please enter all fields",
      });
    }
    //  NEW: phone number validation added
    if (!validator.isMobilePhone(phone + "", "any")) {
      return res.json({
        success: false,
        message: "Invalid phone number",
      });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });

      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, {
        image: imageURL,
      });
    }

    res.json({
      success: true,
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//API TO BOOK APPOINTMENT
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    // Validate input
    if (!userId || !docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const { slotDateTime, error } = parseSlotDateTime(slotDate, slotTime);
    if (error) {
      return res.json({ success: false, message: error });
    }

    const now = new Date();

    // Check if slot is in the past (must be at least current time, no booking past slots)
    if (slotDateTime <= now) {
      return res.json({
        success: false,
        message: "Cannot book past time slots",
      });
    }

    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor is not available" });
    }

    let slots_booked = docData.slots_booked;

    //checking for slots availability
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

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

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

    // Use the new refund logic
    const result = await cancelAppointmentWithRefund(appointmentId, "patient");

    if (result.success) {
      // Send cancellation notification
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

// Helper function to generate meeting link
const generateMeetingLink = (appointmentId) => {
  const timestamp = Date.now();
  const meetingId = `click2care_${appointmentId}_${timestamp}`;
  return {
    meetingId,
    meetingLink: `https://meet.jitsi.org/${meetingId}`,
  };
};

// API to initiate video consultation (book appointment)
const initiateVideoConsultation = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor is not available" });
    }

    let slots_booked = docData.slots_booked;

    // checking for slots availability
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

    // save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({
      success: true,
      message: "Video consultation slot booked. Please complete your details.",
      appointmentId: newAppointment._id,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// NEW API - Create Video Consultation (combined initiate + confirm)
// This endpoint validates slot, creates appointment, marks slot as booked, and generates meeting link
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

    // Validate input
    if (!docId || !slotDate || !slotTime) {
      return res.json({
        success: false,
        message: "Missing required booking details",
      });
    }

    if (!patientName || !patientEmail || !patientPhone) {
      return res.json({
        success: false,
        message: "Missing patient details",
      });
    }

    const { slotDateTime, error } = parseSlotDateTime(slotDate, slotTime);
    if (error) {
      return res.json({ success: false, message: error });
    }

    const now = new Date();

    // Check if slot is in the past
    if (slotDateTime <= now) {
      return res.json({
        success: false,
        message: "Cannot book past time slots",
      });
    }

    // Fetch doctor data
    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData) {
      return res.json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (!docData.available) {
      return res.json({
        success: false,
        message: "Doctor is not available",
      });
    }

    // CRITICAL: Validate slot is still available before booking
    let slots_booked = docData.slots_booked || {};
    const slotIsBooked =
      slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime);

    if (slotIsBooked) {
      return res.json({
        success: false,
        message: "Slot is no longer available. Please select another time.",
      });
    }

    // Fetch user data
    const userData = await userModel.findById(userId).select("-password");
    if (!userData) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Remove sensitive data from docData
    delete docData.slots_booked;

    // Generate meeting link BEFORE saving appointment
    const appointmentIdTemp = new appointmentModel({})._id;
    const { meetingLink, meetingId } = generateMeetingLink(appointmentIdTemp);

    // Create appointment with all details
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
      payment: true, // Payment is mocked as complete in frontend
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

    // Update the meeting link with actual appointment ID
    const finalMeetingLink = `https://meet.jitsi.org/click2care_${newAppointment._id}_${Date.now()}`;
    newAppointment.videoConsultationData.meetingLink = finalMeetingLink;
    await newAppointment.save();

    // Mark the slot as booked on doctor's profile
    if (slots_booked[slotDate]) {
      slots_booked[slotDate].push(slotTime);
    } else {
      slots_booked[slotDate] = [slotTime];
    }
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // Send confirmation email
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

// API to confirm video consultation (submit form and generate meeting link)
const confirmVideoConsultation = async (req, res) => {
  try {
    const { appointmentId, patientName, patientEmail, patientPhone } = req.body;

    // Validate input
    if (!patientName || !patientEmail || !patientPhone) {
      return res.json({
        success: false,
        message: "Please provide all required details",
      });
    }

    if (!validator.isEmail(patientEmail)) {
      return res.json({ success: false, message: "Invalid email address" });
    }

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Generate meeting link
    const { meetingId, meetingLink } = generateMeetingLink(appointmentId);

    // Update appointment with consultation details
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        "videoConsultationData.patientName": patientName,
        "videoConsultationData.patientEmail": patientEmail,
        "videoConsultationData.patientPhone": patientPhone,
        "videoConsultationData.meetingLink": meetingLink,
        "videoConsultationData.meetingId": meetingId,
        payment: true, // Mark as paid (mock payment)
      },
      { new: true },
    );

    // Send confirmation notifications
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

// API to get appointment details with meeting link (for video join page)
const getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// API to mark appointment as joined (for no-show detection)
const markAppointmentJoined = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      joinedAt: Date.now(),
      noShow: false,
    });

    res.json({
      success: true,
      message: "Marked as joined",
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// API to mark appointment as left
const markAppointmentLeft = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      leftAt: Date.now(),
      isCompleted: true,
    });

    res.json({
      success: true,
      message: "Marked as left",
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// API to mark appointment as completed (when doctor ends the meeting)
const markAppointmentCompleted = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Mark appointment as completed
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        isCompleted: true,
        completedAt: Date.now(),
      },
      { new: true },
    );

    console.log("Appointment marked as completed by doctor:", appointmentId);

    // Send completion notification to patient
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

// API to check and mark appointment as no-show if patient didn't join
const checkAndMarkNoShow = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Check if patient joined the meeting
    if (!appointment.joinedAt) {
      // Patient did not join - mark as no-show
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        noShow: true,
      });

      console.log("Appointment marked as no-show:", appointmentId);

      // Send no-show notification to doctor
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

// API to validate meeting join - enforces time window (5 min before, 30 min after)
const validateMeetingJoin = async (req, res) => {
  try {
    const { appointmentId, userId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Verify user is authorized (patient or doctor)
    const isAuthorized =
      appointment.userId === userId || appointment.docId === userId;

    if (!isAuthorized) {
      return res.json({
        success: false,
        message: "Unauthorized to join this meeting",
      });
    }

    // Check if appointment is cancelled
    if (appointment.cancelled) {
      return res.json({
        success: false,
        message: "This appointment has been cancelled",
      });
    }

    // Parse appointment date and time
    const [day, month, year] = appointment.slotDate.split("_").map(Number);
    const [hours, minutes] = appointment.slotTime.split(":").map(Number);

    const appointmentTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    // Calculate time difference in minutes
    const timeDiffMinutes = (appointmentTime - now) / (1000 * 60);

    console.log(`Validating meeting join:`, {
      appointmentId,
      appointmentTime: appointmentTime.toISOString(),
      now: now.toISOString(),
      timeDiffMinutes,
    });

    // Time window: -5 minutes (join early) to +30 minutes (late start) after scheduled time
    if (timeDiffMinutes > 5) {
      return res.json({
        success: false,
        message: "Meeting has not started yet",
        status: "not-started",
        minutesUntilStart: Math.ceil(timeDiffMinutes),
      });
    }

    if (timeDiffMinutes < -30) {
      return res.json({
        success: false,
        message: "Meeting expired - 30+ minutes past scheduled time",
        status: "expired",
      });
    }

    // Valid time window - allow join
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
};
