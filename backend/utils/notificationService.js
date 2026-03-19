// Notification Service - App notifications only

// Generic notification handler
export const sendNotification = async (notificationData) => {
  const {
    type,
    appointment,
    recipientType = "patient",
    refundInfo,
    cancelledBy,
  } = notificationData;

  const recipientName =
    recipientType === "patient"
      ? appointment.userData.name
      : appointment.docData.name;

  let emailSubject = "";
  let emailContent = "";

  switch (type) {
    case "confirmation":
      emailSubject = `Video Consultation Confirmed - ${appointment.docData.name}`;
      emailContent = `
        <h2>Video Consultation Confirmed!</h2>
        <p>Dear ${recipientName},</p>
        <p>Your video consultation has been confirmed.</p>
        <br/>
        <h3>Consultation Details:</h3>
        <ul>
          <li><strong>Doctor:</strong> ${appointment.docData.name}</li>
          <li><strong>Speciality:</strong> ${appointment.docData.speciality}</li>
          <li><strong>Date:</strong> ${appointment.slotDate}</li>
          <li><strong>Time:</strong> ${appointment.slotTime}</li>
          <li><strong>Meeting Link:</strong> <a href="${appointment.videoConsultationData.meetingLink}">Join Video Call</a></li>
        </ul>
        <br/>
        <h3>Important:</h3>
        <ul>
          <li>✓ The meeting link will be active 5 minutes before the scheduled time</li>
          <li>✓ Please join at least 5 minutes early</li>
          <li>✓ You can cancel up to 6 hours before the appointment</li>
          <li>✓ No-show will be marked after 10 minutes grace period</li>
        </ul>
        <br/>
        <p>Best regards,<br/>Click2Care Team</p>
      `;
      break;

    case "cancellation":
      const refundText = refundInfo.isEligible
        ? `Your refund of ₹${refundInfo.refundAmount} will be processed within 3-5 business days.`
        : "No refund available for this cancellation.";

      emailSubject = `Appointment Cancellation - Refund Information`;
      emailContent = `
        <h2>Appointment Cancelled</h2>
        <p>Dear ${recipientName},</p>
        <p>Your ${recipientType === "doctor" ? "patient appointment" : "video consultation"} has been cancelled.</p>
        <br/>
        <h3>Cancelled Appointment Details:</h3>
        <ul>
          <li><strong>${recipientType === "doctor" ? "Patient" : "Doctor"}:</strong> ${recipientType === "doctor" ? appointment.userData.name : appointment.docData.name}</li>
          <li><strong>Date:</strong> ${appointment.slotDate}</li>
          <li><strong>Time:</strong> ${appointment.slotTime}</li>
          <li><strong>Cancelled by:</strong> ${cancelledBy === "patient" ? "Patient" : "Doctor"}</li>
        </ul>
        <br/>
        <h3>Refund Status:</h3>
        <p>${refundText}</p>
        <p>Reason: ${refundInfo.reason}</p>
        <br/>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br/>Click2Care Team</p>
      `;
      break;

    case "no-show":
      emailSubject = "Appointment Marked as No-Show";
      emailContent = `
        <h2>Appointment No-Show</h2>
        <p>Dear ${recipientName},</p>
        <p>${recipientType === "patient" ? "You did not join" : "The patient did not join"} your scheduled video consultation.</p>
        <br/>
        <h3>Appointment Details:</h3>
        <ul>
          <li><strong>${recipientType === "doctor" ? "Patient" : "Doctor"}:</strong> ${recipientType === "doctor" ? appointment.userData.name : appointment.docData.name}</li>
          <li><strong>Date:</strong> ${appointment.slotDate}</li>
          <li><strong>Time:</strong> ${appointment.slotTime}</li>
          <li><strong>Status:</strong> No-Show</li>
        </ul>
        <br/>
        ${
          recipientType === "patient"
            ? `
          <h3>No Refund Policy:</h3>
          <p>As per our terms, no refund is provided for no-show appointments. However, you can book a new appointment immediately.</p>
          `
            : ""
        }
        <p>Best regards,<br/>Click2Care Team</p>
      `;
      break;

    case "reminder":
      emailSubject = `Reminder: Video Consultation Tomorrow at ${appointment.slotTime}`;
      emailContent = `
        <h2>Consultation Reminder</h2>
        <p>Dear ${recipientName},</p>
        <p>This is a friendly reminder about your upcoming video consultation.</p>
        <br/>
        <h3>Consultation Details:</h3>
        <ul>
          <li><strong>Doctor:</strong> ${appointment.docData.name}</li>
          <li><strong>Date:</strong> ${appointment.slotDate}</li>
          <li><strong>Time:</strong> ${appointment.slotTime}</li>
          <li><strong>Meeting Link:</strong> <a href="${appointment.videoConsultationData.meetingLink}">Join Video Call</a></li>
        </ul>
        <br/>
        <h3>Please Remember:</h3>
        <ul>
          <li>✓ Join 5 minutes before the scheduled time</li>
          <li>✓ Ensure good lighting and background</li>
          <li>✓ Check your internet connection</li>
          <li>✓ Use headphones for better audio</li>
        </ul>
        <br/>
        <p>Best regards,<br/>Click2Care Team</p>
      `;
      break;

    default:
      break;
  }
};

// Schedule appointment reminders (24 hours before)
export const scheduleAppointmentReminder = async (appointment) => {
  const [day, month, year] = appointment.slotDate.split("_").map(Number);
  const [hours, minutes] = appointment.slotTime.split(":").map(Number);

  const appointmentTime = new Date(year, month - 1, day, hours, minutes);
  const reminderTime = new Date(
    appointmentTime.getTime() - 24 * 60 * 60 * 1000,
  );

  const now = Date.now();
  const timeUntilReminder = reminderTime.getTime() - now;

  if (timeUntilReminder > 0) {
    setTimeout(() => {
      sendNotification({
        type: "reminder",
        appointment,
        recipientType: "patient",
      });

      sendNotification({
        type: "reminder",
        appointment,
        recipientType: "doctor",
      });
    }, timeUntilReminder);
  }
};
