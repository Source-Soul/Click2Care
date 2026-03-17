import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("DATABASE CONNECTED"));

  const mongoUri = (process.env.MONGODB_URI || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "");

  await mongoose.connect(mongoUri, { dbName: "click2care" });
};

export default connectDB;
