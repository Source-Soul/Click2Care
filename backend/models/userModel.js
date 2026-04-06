import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // Default image link use kora bhalo base64 er jaygay
  },
  address: {
    type: Object,
    default: { line1: "None", line2: "None" },
  },
  gender: { type: String, default: "Not Selected" },
  dob: { type: String, default: "0000-00-00" },
  phone: { type: String, default: "0000000000" },

  // ==========================================
  // Blood Group Field Add Kora Holo
  // ==========================================
  bloodGroup: { type: String, default: "Not Provided" },

  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpiresAt: { type: Date },
  googleId: { type: String, default: null },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
