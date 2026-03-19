import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { JitsiMeeting } from "@jitsi/react-sdk";

const DoctorVideoMeeting = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { dToken, backendUrl, completeVideoConsultation } =
    useContext(DoctorContext);

  useContext(AppContext);

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTimeValid, setIsTimeValid] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState("waiting");
  const [timeMessage, setTimeMessage] = useState("");
  const [jitsiError, setJitsiError] = useState(null);

  const jitsiApiRef = useRef(null);

  // ---------- TIME ----------
  const parseTime = (d, t) => {
    try {
      const [day, month, year] = d.split("_").map(Number);

      // Match: "HH:MM AM/PM" or "HH:MM"
      const timeMatch = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
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

  const checkTime = (apt) => {
    const aptTime = parseTime(apt.slotDate, apt.slotTime);
    if (!aptTime) return { valid: false };

    const diff = (aptTime - new Date()) / 60000;

    if (diff > 10)
      return { valid: false, status: "waiting", message: "Too early" };

    if (diff < -30)
      return { valid: false, status: "expired", message: "Expired" };

    return { valid: true, status: "active", message: "Live" };
  };

  // ---------- FETCH ----------
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/user/appointment-details`,
          { appointmentId },
          { headers: { token: dToken } },
        );

        if (!data.success) {
          navigate("/doctor/appointments");
          return;
        }

        const apt = data.appointment;

        if (apt.cancelled) {
          setJitsiError("Cancelled");
          return;
        }

        setAppointment(apt);

        const check = checkTime(apt);
        setIsTimeValid(check.valid);
        setMeetingStatus(check.status);
        setTimeMessage(check.message);
      } catch {
        toast.error("Error loading appointment");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [appointmentId]);

  // ---------- JITSI ----------
  const handleReady = useCallback((api) => {
    jitsiApiRef.current = api;

    toast.success("Meeting started");

    api.addEventListener("readyToClose", async () => {
      await completeVideoConsultation(appointmentId);
      navigate("/doctor/appointments");
    });
  }, []);

  const handleError = (e) => {
    console.log("JITSI ERROR:", e);
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
        No appointment
      </div>
    );

  const meetingId = `click2care_${appointmentId}`;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between">
        <div>
          <h2 className="font-bold text-lg">Doctor Meeting</h2>
          <p>{appointment?.userData?.name}</p>
        </div>
        <div className="font-semibold">{timeMessage}</div>
      </div>

      {/* MAIN */}
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
                    displayName: appointment?.docData?.name || "Doctor",
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
                  // 🔥 FULLSCREEN FIX
                  getIFrameRef={(iframe) => {
                    iframe.style.height = "100%";
                    iframe.style.width = "100%";
                    iframe.style.border = "0";
                  }}
                  onReady={handleReady}
                  onError={handleError}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">
                {meetingStatus === "expired" ? "Meeting Expired" : "Waiting"}
              </h2>
              <p>{timeMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorVideoMeeting;
