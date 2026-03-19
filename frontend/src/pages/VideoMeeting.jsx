import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { JitsiMeeting } from "@jitsi/react-sdk";

const VideoMeeting = () => {
  const { appointmentId } = useParams();
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTimeValid, setIsTimeValid] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState("waiting");
  const [timeMessage, setTimeMessage] = useState("");
  const [jitsiError, setJitsiError] = useState(null);

  const jitsiApiRef = useRef(null);

  // ---------- PARSE TIME ----------
  const parseAppointmentTime = (slotDate, slotTime) => {
    try {
      const [day, month, year] = slotDate.split("_").map(Number);

      // Match: "HH:MM AM/PM" or "HH:MM"
      const timeMatch = slotTime
        .trim()
        .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
      if (!timeMatch) return null;

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

      return new Date(year, month - 1, day, hours, minutes);
    } catch {
      return null;
    }
  };

  // ---------- TIME CHECK ----------
  const checkTimeValidity = (apt) => {
    const aptTime = parseAppointmentTime(apt.slotDate, apt.slotTime);
    if (!aptTime) return { valid: false, status: "error" };

    const now = new Date();
    const diff = (aptTime - now) / 60000;

    if (diff < -30)
      return { valid: false, status: "expired", message: "Meeting expired" };

    if (diff > 5)
      return {
        valid: false,
        status: "waiting",
        message: `Starts in ${Math.ceil(diff)} min`,
      };

    return { valid: true, status: "active", message: "Meeting active" };
  };

  // ---------- FETCH ----------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/user/appointment-details`,
          { appointmentId },
          { headers: { token } },
        );

        if (data.success) {
          setAppointment(data.appointment);
          const check = checkTimeValidity(data.appointment);
          setIsTimeValid(check.valid);
          setMeetingStatus(check.status);
          setTimeMessage(check.message);
        }
      } catch {
        toast.error("Failed to load appointment");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  // ---------- JITSI READY ----------
  const handleJitsiReady = useCallback((api) => {
    jitsiApiRef.current = api;

    api.addEventListener("videoConferenceJoined", () => {
      toast.success("Joined meeting");
    });

    api.addEventListener("videoConferenceLeft", () => {
      toast.info("Left meeting");
      navigate("/my-appointments");
    });
  }, []);

  // ---------- ERROR ----------
  const handleJitsiError = (err) => {
    console.log("JITSI ERROR:", err);
    setJitsiError("Failed to load video");
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!appointment)
    return (
      <div className="h-screen flex items-center justify-center">
        No appointment found
      </div>
    );

  const meetingId = `click2care_${appointmentId}`;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Video Consultation</h2>
          <p className="text-sm text-gray-600">
            {appointment?.docData?.name} | {appointment?.userData?.name}
          </p>
        </div>
        <div className="text-sm font-semibold">{timeMessage}</div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {isTimeValid ? (
          <div className="flex-1 bg-black">
            {jitsiError ? (
              <div className="h-full flex items-center justify-center text-red-500">
                {jitsiError}
              </div>
            ) : (
              <div className="h-full w-full">
                <JitsiMeeting
                  key={meetingId}
                  domain="meet.jit.si"
                  roomName={meetingId}
                  userInfo={{
                    displayName: appointment?.userData?.name || "Guest",
                  }}
                  configOverwrite={{
                    prejoinPageEnabled: true,
                    startWithVideoMuted: false,
                    startWithAudioMuted: false,
                    enableWelcomePage: false,
                  }}
                  interfaceConfigOverwrite={{
                    SHOW_JITSI_WATERMARK: false,
                  }}
                  // 🔥 THIS FIXES FULLSCREEN ISSUE
                  getIFrameRef={(iframe) => {
                    iframe.style.height = "100%";
                    iframe.style.width = "100%";
                    iframe.style.border = "0";
                  }}
                  onReady={handleJitsiReady}
                  onError={handleJitsiError}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">
                {meetingStatus === "expired"
                  ? "Meeting Expired"
                  : "Waiting for Meeting"}
              </h2>
              <p>{timeMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoMeeting;
