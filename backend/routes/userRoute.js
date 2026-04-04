import express from "express";
import {
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
} from "../controllers/userController.js";
import authUser from "../middleware/authUser.js";
import upload from "../middleware/multer.js";
import {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIpn,
  retryPayment,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);

userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);

// Video Consultation Routes
userRouter.post(
  "/initiate-video-consultation",
  authUser,
  initiateVideoConsultation
);
userRouter.post(
  "/create-video-consultation",
  authUser,
  createVideoConsultation
);
userRouter.post(
  "/confirm-video-consultation",
  authUser,
  confirmVideoConsultation
);
userRouter.post("/appointment-details", authUser, getAppointmentDetails);
userRouter.post("/validate-meeting-join", authUser, validateMeetingJoin);
userRouter.post("/mark-joined", authUser, markAppointmentJoined);
userRouter.post("/mark-left", authUser, markAppointmentLeft);
userRouter.post("/mark-completed", authUser, markAppointmentCompleted);
userRouter.post("/check-no-show", authUser, checkAndMarkNoShow);

userRouter.post("/initiate-payment", authUser, initiatePayment);
userRouter.post("/payment/success/:tran_id", paymentSuccess);
userRouter.post("/payment/fail/:tran_id", paymentFail);
userRouter.post("/payment/cancel/:tran_id", paymentCancel);
userRouter.post("/payment/ipn", paymentIpn);
userRouter.post("/retry-payment", authUser, retryPayment);
export default userRouter;
