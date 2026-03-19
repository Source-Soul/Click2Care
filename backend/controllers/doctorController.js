import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendNotification } from "../utils/notificationService.js";
import { cancelAppointmentWithRefund } from "../utils/appointmentService.js";
const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;
    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availability changed successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API FOR DOCTOR LOGIN

const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);

      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API TO GET DOCTOR APPOINTMENT FOR DOCTOR PANEL
const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Api to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId.toString() == docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      return res.json({ success: true, message: "Appointment Completed" });
    } else {
      return res.json({ success: false, message: "Mark Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Api to mark appointment cancel for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId.toString() == docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      return res.json({ success: true, message: "Appointment Cancelled" });
    } else {
      return res.json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;

    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];
    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });
    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };
    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get doctor profile for doctor panel
const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select("-password");
    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to update doctor profile data from doctor panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available } = req.body;
    await doctorModel.findByIdAndUpdate(docId, { fees, address, available });
    res.json({ success: true, message: "profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor's video consultations
const getDoctorVideoConsultations = async (req, res) => {
  try {
    const { docId } = req.body;

    const videoConsultations = await appointmentModel.find({
      docId,
      appointmentType: "video",
    });

    res.json({
      success: true,
      videoConsultations,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for doctor to cancel video consultation
const cancelVideoConsultation = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Verify doctor owns this appointment
    if (appointment.docId !== docId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    // Cancel appointment with refund
    const result = await cancelAppointmentWithRefund(appointmentId, "doctor");

    if (result.success) {
      // Send cancellation notification to patient
      await sendNotification({
        type: "cancellation",
        appointment,
        refundInfo: result.refundInfo,
        recipientType: "patient",
        cancelledBy: "doctor",
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

// API to mark video consultation as completed
const completeVideoConsultation = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Verify doctor owns this appointment
    if (appointment.docId !== docId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      isCompleted: true,
      noShow: false,
    });

    res.json({
      success: true,
      message: "Video consultation marked as completed",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for doctor to mark video meeting as joined
const markVideoMeetingJoined = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Verify doctor owns this appointment
    if (appointment.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized: Not your appointment",
      });
    }

    // Update appointment with doctor join time
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      "videoConsultationData.doctorJoinedAt": Date.now(),
      noShow: false,
    });

    console.log("Doctor marked as joined:", appointmentId);

    res.json({
      success: true,
      message: "Doctor marked as joined",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for doctor to mark video meeting as left
const markVideoMeetingLeft = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Verify doctor owns this appointment
    if (appointment.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized: Not your appointment",
      });
    }

    // Update appointment with doctor leave time
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      "videoConsultationData.doctorLeftAt": Date.now(),
    });

    console.log("Doctor marked as left:", appointmentId);

    res.json({
      success: true,
      message: "Doctor marked as left",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  changeAvailability,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  getDoctorVideoConsultations,
  cancelVideoConsultation,
  completeVideoConsultation,
  markVideoMeetingJoined,
  markVideoMeetingLeft,
};
