import express from "express";
import {
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
} from "../controllers/doctorController.js";
import authDoctor from "../middleware/authDoctor.js";

const doctorRouter = express.Router();

doctorRouter.get("/list", doctorList);
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);

// Video Consultation Routes
doctorRouter.post(
  "/video-consultations",
  authDoctor,
  getDoctorVideoConsultations,
);
doctorRouter.post(
  "/cancel-video-consultation",
  authDoctor,
  cancelVideoConsultation,
);
doctorRouter.post(
  "/complete-video-consultation",
  authDoctor,
  completeVideoConsultation,
);

// Video Meeting Tracking Routes
doctorRouter.post(
  "/mark-video-joined",
  authDoctor,
  markVideoMeetingJoined,
);
doctorRouter.post(
  "/mark-video-left",
  authDoctor,
  markVideoMeetingLeft,
);

export default doctorRouter;
