import cron from "node-cron";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import { sendNotification } from "./notificationService.js";

// Run every 5 minutes to check for no-shows
export const initializeNoShowDetection = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("Running no-show detection...");

      // Get all appointments that haven't been marked as no-show yet
      const appointments = await appointmentModel.find({
        noShow: false,
        cancelled: false,
        isCompleted: false,
      });

      const now = Date.now();
      const gracePeriodMs = 10 * 60 * 1000; // 10 minutes

      for (const appointment of appointments) {
        const [day, month, year] = appointment.slotDate.split("_").map(Number);
        const [hours, minutes] = appointment.slotTime.split(":").map(Number);

        const appointmentTime = new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
        ).getTime();
        const timePassedSinceAppointment = now - appointmentTime;

        // Check if appointment time has passed and user hasn't joined
        if (
          timePassedSinceAppointment > gracePeriodMs &&
          !appointment.joinedAt
        ) {
          // Mark as no-show
          await appointmentModel.findByIdAndUpdate(appointment._id, {
            noShow: true,
            isCompleted: true,
          });

          // Send notification to patient and doctor
          await sendNotification({
            type: "no-show",
            appointment,
            recipientType: "patient",
          });

          await sendNotification({
            type: "no-show",
            appointment,
            recipientType: "doctor",
          });

          console.log(`Appointment ${appointment._id} marked as no-show`);
        }
      }
    } catch (error) {
      console.error("Error in no-show detection:", error);
    }
  });
};

// Check cancellation eligibility and refund amount
export const calculateRefund = (appointment) => {
  const appointmentTime = new Date(
    ...appointment.slotDate.split("_").reverse().map(Number),
  ).getTime();

  const now = Date.now();
  const hoursBefore = (appointmentTime - now) / (1000 * 60 * 60);

  if (hoursBefore >= 6) {
    // Full refund
    return {
      isEligible: true,
      refundAmount: appointment.amount,
      reason: "Full refund - cancelled 6+ hours before",
    };
  } else if (hoursBefore > 0) {
    // 50% refund
    return {
      isEligible: true,
      refundAmount: Math.round(appointment.amount * 0.5),
      reason: "50% refund - cancelled 0-6 hours before",
    };
  } else {
    // No refund - appointment already passed
    return {
      isEligible: false,
      refundAmount: 0,
      reason: "No refund - appointment time has passed",
    };
  }
};

// Mark appointment as cancelled with refund processing
export const cancelAppointmentWithRefund = async (
  appointmentId,
  cancelledBy,
) => {
  try {
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return { success: false, message: "Appointment not found" };
    }

    if (appointment.cancelled) {
      return { success: false, message: "Appointment already cancelled" };
    }

    const refundInfo = calculateRefund(appointment);

    // Check if cancellation is within allowed time
    if (!refundInfo.isEligible && cancelledBy === "patient") {
      return {
        success: false,
        message: "Cannot cancel - appointment time has passed",
      };
    }

    // Update appointment with cancellation details
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
      cancelledBy,
      cancelledAt: Date.now(),
      refundAmount: refundInfo.refundAmount,
      refundStatus: "pending",
    });

    // Release the doctor's slot
    const { docId, slotDate, slotTime } = appointment;
    const doctorData = await doctorModel.findById(docId);

    if (doctorData) {
      let slots_booked = doctorData.slots_booked;
      if (slots_booked[slotDate]) {
        slots_booked[slotDate] = slots_booked[slotDate].filter(
          (time) => time !== slotTime,
        );
      }
      await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    }

    // Send cancellation notification
    await sendNotification({
      type: "cancellation",
      appointment,
      refundInfo,
      recipientType: "patient",
      cancelledBy,
    });

    return {
      success: true,
      message: "Appointment cancelled successfully",
      refundInfo,
    };
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return { success: false, message: error.message };
  }
};
