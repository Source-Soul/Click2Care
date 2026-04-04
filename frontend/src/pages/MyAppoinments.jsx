import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const MyAppoinments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const timerRef = useRef(null);

  const months = [
    " ",
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return (
      dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    );
  };

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });
      if (data.success) {
        setAppointments(data.appointments.reverse());
        console.log(data.appointments);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/cancel-appointment",
        { appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        if (data.refundInfo) {
          toast.info(`${data.refundInfo.reason}`);
        }
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const paymentSslcommerz = async (appointmentId) => {
    try {
      const toastId = toast.loading("Connecting to secure payment...");
      const { data } = await axios.post(
        backendUrl + "/api/user/retry-payment",
        { appointmentId },
        { headers: { token } }
      );

      if (data.success && data.url) {
        toast.dismiss(toastId);
        // FIX: href is a property, not a function! Use '=' so the back button works natively.
        window.location.href = data.url;
      } else {
        toast.update(toastId, {
          render: data.message,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to initiate payment");
    }
  };

  const canCancelAppointment = (appointment) => {
    if (appointment.cancelled) {
      return false;
    }
    if (appointment.noShow) {
      return false;
    }
    return true;
  };

  /**
   * Parse time string safely (handles AM/PM formats)
   */
  const parseTime = (timeStr) => {
    try {
      const timeMatch = timeStr
        .trim()
        .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
      if (!timeMatch) return { hours: 0, minutes: 0 };

      const [, hourStr, minuteStr, meridiemRaw] = timeMatch;
      let hours = Number(hourStr);
      const minutes = Number(minuteStr);
      const meridiem = meridiemRaw ? meridiemRaw.toUpperCase() : null;

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
   * Check if meeting time has passed (30+ minutes after scheduled time)
   */
  const isMeetingExpired = (appointment) => {
    if (appointment.appointmentType !== "video") {
      return false;
    }

    try {
      const [day, month, year] = appointment.slotDate.split("_").map(Number);
      const { hours, minutes } = parseTime(appointment.slotTime);
      const appointmentTime = new Date(year, month - 1, day, hours, minutes);

      const meetingEndTime = new Date(appointmentTime.getTime() + 30 * 60000);
      const now = new Date();

      const expired = now > meetingEndTime;

      return expired;
    } catch (error) {
      console.error("Error checking if meeting expired:", error);
      return false;
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);

  // Re-render every 1 second to update button status
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
        My Appointments
      </p>
      <div>
        {appointments.map((item, index) => {
          const isExpired = isMeetingExpired(item);

          return (
            <div
              className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
              key={`${item._id}-${refreshTrigger}`}
            >
              <div>
                <img
                  className="w-32 bg-indigo-50"
                  src={item.docData.image}
                  alt=""
                />
              </div>
              <div className="flex-1 text-sm text-zinc-600">
                <p className="text-neutral-800 font-semibold">
                  {item.docData.name}
                </p>
                <p className="text-sm text-gray-600">
                  {item.docData.speciality}
                </p>

                {/* Appointment Type & Payment Status Badges */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.appointmentType === "video" ? (
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Video Consultation
                    </span>
                  ) : (
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Offline Consultation
                    </span>
                  )}

                  {/* SSLCommerz Payment Badge */}
                  {item.payment || item.paymentStatus === "Success" ? (
                    <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      ✓ Paid via SSLCommerz
                    </span>
                  ) : (
                    <span className="inline-block border border-orange-400 text-orange-500 px-3 py-1 rounded-full text-xs font-semibold">
                      Payment Pending
                    </span>
                  )}
                </div>

                <p className="text-zinc-700 font-medium mt-2">Address:</p>
                <p className="text-xs">{item.docData.address.line1}</p>
                <p className="text-xs">{item.docData.address.line2}</p>
                <p className="text-xs mt-1">
                  <span className="text-sm text-neutral-700 font-medium">
                    Date & Time:
                  </span>
                  {slotDateFormat(item.slotDate)} | {item.slotTime}
                </p>

                {/* No-Show Status */}
                {item.noShow && (
                  <p className="text-xs text-red-600 mt-2 font-semibold">
                    Appointment Marked as No-Show
                  </p>
                )}
              </div>
              <div></div>

              {/* --- ACTION BUTTONS --- */}
              <div className="flex flex-col gap-2 justify-end">
                {/* 1. Payment Button (Shows for ANY unpaid appointment: Offline OR Video) */}
                {!item.cancelled &&
                  !item.isCompleted &&
                  !item.payment &&
                  item.paymentStatus !== "Success" && (
                    <button
                      onClick={() => paymentSslcommerz(item._id)}
                      className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border border-gray-300 rounded hover:bg-primary hover:text-white transition-all duration-300"
                    >
                      Pay Online
                    </button>
                  )}

                {/* 2. Video Consultation Actions (ONLY shows if PAID) */}
                {item.appointmentType === "video" &&
                  !item.cancelled &&
                  !item.noShow &&
                  !item.isCompleted &&
                  (item.payment || item.paymentStatus === "Success") && (
                    <>
                      {isExpired ? (
                        <button
                          disabled
                          className="text-sm text-center sm:min-w-48 py-3 px-4 border border-gray-400 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed font-semibold"
                        >
                          ⏱️ Meeting Expired
                        </button>
                      ) : item.videoConsultationData?.meetingLink ? (
                        <button
                          onClick={() => navigate(`/video-meeting/${item._id}`)}
                          className="text-sm text-center sm:min-w-48 py-3 px-4 border-2 border-blue-500 rounded-lg text-blue-600 font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-700 transition-all duration-300"
                        >
                          Join Video Meeting
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-sm text-center sm:min-w-48 py-3 px-4 border border-gray-300 rounded-lg text-gray-400 bg-gray-100 cursor-not-allowed font-semibold"
                        >
                          Awaiting Confirmation
                        </button>
                      )}
                    </>
                  )}

                {/* 3. Completed Status */}
                {item.isCompleted && (
                  <button
                    disabled
                    className="text-sm text-center sm:min-w-48 py-3 px-4 border border-green-500 rounded-lg text-green-600 bg-green-50 font-semibold"
                  >
                    ✓ Consultation Completed
                  </button>
                )}

                {/* 4. Cancel Appointment Button */}
                {canCancelAppointment(item) &&
                  !isExpired &&
                  !item.isCompleted && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to cancel this appointment?"
                          )
                        ) {
                          cancelAppointment(item._id);
                        }
                      }}
                      className="text-sm text-center sm:min-w-48 py-2 px-4 border border-red-500 rounded text-red-500 hover:bg-red-600 hover:text-white transition-all duration-300"
                    >
                      Cancel Appointment
                    </button>
                  )}

                {/* 5. Cancelled Status */}
                {item.cancelled && (
                  <button
                    disabled
                    className="sm:min-w-48 py-2 px-4 border border-red-500 rounded-lg text-red-500 bg-red-50 font-semibold"
                  >
                    ✗ Cancelled
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyAppoinments;
