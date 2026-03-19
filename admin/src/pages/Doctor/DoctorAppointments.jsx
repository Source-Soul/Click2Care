import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const {
    dToken,
    appointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    completeVideoConsultation,
    cancelVideoConsultation,
    markVideoMeetingJoined,
    markVideoMeetingLeft,
  } = useContext(DoctorContext);
  const { calculateAge, slotDateFormat, currency, backendUrl, token } =
    useContext(AppContext);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const timerRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  // Re-render every 1 second to update button status
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  /**
   * Handle joining a video consultation meeting
   */
  const handleJoinMeeting = async (appointment) => {
    if (appointment.isVideo || appointment.appointmentType === "video") {
      if (!appointment._id) {
        toast.error("Appointment ID not found");
        return;
      }

      console.log(
        "Navigating to video meeting for appointment:",
        appointment._id,
      );
      navigate(`/doctor/video-meeting/${appointment._id}`);
    } else {
      toast.info("This is an offline appointment");
    }
  };

  /**
   * Handle completing video consultation
   */
  const handleCompleteVideoConsultation = async (appointmentId) => {
    await completeVideoConsultation(appointmentId);
  };

  /**
   * Handle cancelling video consultation
   */
  const handleCancelVideoConsultation = async (appointmentId) => {
    if (
      window.confirm("Are you sure you want to cancel this video consultation?")
    ) {
      await cancelVideoConsultation(appointmentId);
    }
  };

  /**
   * Parse time string safely (handles AM/PM formats)
   */
  const parseTime = (timeStr) => {
    try {
      // Match: "HH:MM AM/PM" or "HH:MM"
      const timeMatch = timeStr
        .trim()
        .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
      if (!timeMatch) return { hours: 0, minutes: 0 };

      const [, hourStr, minuteStr, meridiemRaw] = timeMatch;
      let hours = Number(hourStr);
      const minutes = Number(minuteStr);
      const meridiem = meridiemRaw ? meridiemRaw.toUpperCase() : null;

      // Convert 12-hour to 24-hour format
      if (meridiem) {
        if (meridiem === "PM" && hours !== 12) {
          hours += 12;
        } else if (meridiem === "AM" && hours === 12) {
          hours = 0;
        }
      }

      return { hours, minutes };
    } catch (error) {
      console.error("Error parsing time:", error, timeStr);
      return { hours: 0, minutes: 0 };
    }
  };

  /**
   * Check if meeting is currently active (within time window)
   */
  const isMeetingActive = (slotDate, slotTime) => {
    try {
      const [day, month, year] = slotDate.split("_").map(Number);
      const { hours, minutes } = parseTime(slotTime);
      const appointmentTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      const timeDiffMinutes = (appointmentTime - now) / (1000 * 60);

      const isActive = timeDiffMinutes >= -15 && timeDiffMinutes <= 30;

      console.log("Meeting Active Check:", {
        appointment: appointmentTime.toLocaleString(),
        now: now.toLocaleString(),
        minutesUntil: timeDiffMinutes.toFixed(1),
        isActive,
      });

      return isActive;
    } catch (error) {
      console.error("Error checking meeting active status:", error);
      return false;
    }
  };

  /**
   * Check if meeting has expired (30+ minutes after scheduled time)
   */
  const isMeetingExpired = (slotDate, slotTime) => {
    try {
      const [day, month, year] = slotDate.split("_").map(Number);
      const { hours, minutes } = parseTime(slotTime);
      const appointmentTime = new Date(year, month - 1, day, hours, minutes);

      // Add 30 minutes to the scheduled time
      const meetingEndTime = new Date(appointmentTime.getTime() + 30 * 60000);
      const now = new Date();

      const expired = now > meetingEndTime;

      console.log("Meeting Expired Check:", {
        appointment: appointmentTime.toLocaleString(),
        meetingEndTime: meetingEndTime.toLocaleString(),
        now: now.toLocaleString(),
        isExpired: expired,
      });

      return expired;
    } catch (error) {
      console.error("Error checking if meeting expired:", error);
      return false;
    }
  };

  return (
    <div className="w-full max-w-7xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>
      <div className="bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll">
        <div className="hidden sm:grid grid-cols-[0.5fr_3fr_1fr_2fr_2fr_1.5fr_1fr_2fr] grid-flow-col py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold border-b sticky top-0 z-10 shadow-lg">
          <p>#</p>
          <p>Patient</p>
          <p>Type</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Status</p>
          <p>Join Meeting</p>
          <p>Actions</p>
        </div>

        {appointments && appointments.length > 0 ? (
          [...appointments].reverse().map((item, index) => {
            // Compute isActive ONCE per render
            const isActive =
              item.isVideo || item.appointmentType === "video"
                ? isMeetingActive(item.slotDate, item.slotTime)
                : false;

            // Compute isExpired ONCE per render
            const isExpired =
              item.isVideo || item.appointmentType === "video"
                ? isMeetingExpired(item.slotDate, item.slotTime)
                : false;

            // Determine row color based on status
            let rowBgColor = "bg-white";
            if (item.cancelled) {
              rowBgColor = "bg-red-50";
            } else if (item.isCompleted) {
              rowBgColor = "bg-green-50";
            } else if (item.noShow) {
              rowBgColor = "bg-orange-50";
            } else if (index % 2 === 0) {
              rowBgColor = "bg-blue-50";
            }

            return (
              <div
                className={`flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_2fr_2fr_1.5fr_1fr_2fr] items-center text-gray-700 py-3 px-6 border-b hover:shadow-md transition-all duration-200 ${rowBgColor}`}
                key={`${item._id}-${refreshTrigger}`}
              >
                <p className="max-sm:hidden">{index + 1}</p>
                <div className="flex items-center gap-2">
                  <img
                    className="w-8 rounded-full"
                    src={item.userData?.image || assets.default_user}
                    alt=""
                  />{" "}
                  <p>{item.userData?.name || "Unknown"}</p>
                </div>

                {/* Appointment Type Badge */}
                <div>
                  {item.isVideo || item.appointmentType === "video" ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Video
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      Offline
                    </span>
                  )}
                </div>

                <p>
                  {slotDateFormat(item.slotDate)}, {item.slotTime}
                </p>
                <p>
                  {currency}
                  {item.amount}
                </p>

                {/* Status */}
                <div>
                  {item.cancelled ? (
                    <p className="text-red-400 text-xs font-medium">
                      Cancelled
                    </p>
                  ) : item.isCompleted ? (
                    <p className="text-green-500 text-xs font-medium">
                      Completed
                    </p>
                  ) : item.noShow ? (
                    <p className="text-orange-400 text-xs font-medium">
                      No-Show
                    </p>
                  ) : (
                    <p className="text-blue-500 text-xs font-medium">Pending</p>
                  )}
                </div>

                {/* Video Meeting Button */}
                <div>
                  {item.isVideo || item.appointmentType === "video" ? (
                    <>
                      {isExpired ? (
                        // Meeting Expired
                        <button
                          disabled
                          className="text-xs px-3 py-1 rounded font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                          title="Consultation time window has passed"
                        >
                          ⏱️ Expired
                        </button>
                      ) : !item.cancelled && !item.isCompleted ? (
                        <button
                          onClick={() => handleJoinMeeting(item)}
                          disabled={!isActive}
                          className={`text-xs px-2 py-1 rounded font-medium transition-all ${
                            isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                              : "bg-gray-100 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isActive ? "Join" : "Wait"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>

                {/* Actions */}
                <div>
                  {item.cancelled ? (
                    <p className="text-red-400 text-xs font-medium">
                      Cancelled
                    </p>
                  ) : item.isCompleted ? (
                    <p className="text-green-500 text-xs font-medium">Done</p>
                  ) : (
                    <div className="flex gap-2">
                      {/* Cancel Button */}
                      <button
                        onClick={() =>
                          item.isVideo || item.appointmentType === "video"
                            ? handleCancelVideoConsultation(item._id)
                            : cancelAppointment(item._id)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-100 transition-colors"
                        title="Cancel Appointment"
                      >
                        <img
                          src={assets.cancel_icon}
                          alt="Cancel"
                          className="w-5"
                        />
                      </button>

                      {/* Complete Button */}
                      <button
                        onClick={() =>
                          item.isVideo || item.appointmentType === "video"
                            ? handleCompleteVideoConsultation(item._id)
                            : completeAppointment(item._id)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-green-100 transition-colors"
                        title="Mark Complete"
                      >
                        <img
                          src={assets.tick_icon}
                          alt="Complete"
                          className="w-5"
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500">
            No appointments found
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
