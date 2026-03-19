import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, required: true },
  date: { type: Number, required: true },
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },

  // Video Consultation Fields
  appointmentType: {
    type: String,
    enum: ["offline", "video"],
    default: "offline",
  },
  isVideo: { type: Boolean, default: false },
  videoConsultationData: {
    patientName: { type: String },
    patientEmail: { type: String },
    patientPhone: { type: String },
    meetingLink: { type: String },
    meetingId: { type: String },
  },

  // No-show and Cancellation Tracking
  noShow: { type: Boolean, default: false },
  cancelledBy: { type: String, enum: ["patient", "doctor"], default: null },
  cancelledAt: { type: Number, default: null },
  joinedAt: { type: Number, default: null },
  leftAt: { type: Number, default: null },
  completedAt: { type: Number, default: null },

  //Refund Information
  refundAmount: { type: Number, default: 0 },
  refundStatus: {
    type: String,
    enum: ["pending", "processed", "failed"],
    default: null,
  },
});

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);
export default appointmentModel;
