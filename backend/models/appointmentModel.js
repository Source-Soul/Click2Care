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
  isCompleted: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },

  // NEW FIELDS FOR REFACTORING AND PAYMENT
  appointmentType: {
    type: String,
    enum: ["offline", "video"],
    required: true,
    default: "offline",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Success", "Failed", "Cancelled"],
    default: "Pending",
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true, // sparse allows multiple null/undefined values while keeping actual IDs unique
  },
  val_id: {
    type: String,
    default: "", // Populated later upon successful SSLCommerz validation
  },
  meetingLink: {
    type: String,
    default: "",
  },
  isVideo: { type: Boolean, default: false },
  videoConsultationData: { type: Object, default: {} },
});

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;
