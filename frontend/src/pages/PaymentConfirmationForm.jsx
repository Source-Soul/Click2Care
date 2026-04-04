import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const PaymentConfirmationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);

  // Get booking details from navigation state (including appointmentType)
  const { docId, slotDate, slotTime, docInfo, appointmentType } =
    location.state || {};

  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [meetingLink, setMeetingLink] = useState(null);
  const [confirmationComplete, setConfirmationComplete] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);

  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
  });

  // Determine if the flow is for video or offline based on passed state
  const isVideo = appointmentType === "video";
  const displayType = isVideo ? "Video Consultation" : "In-Clinic Consultation";

  // Redirect if no booking details
  if (!docId || !slotDate || !slotTime || !docInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            Invalid booking. Please select a slot again.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitPaymentConfirmation = async () => {
    try {
      setLoading(true);
      setPaymentProcessing(true);

      // 1. Basic Validate form
      if (
        !formData.patientName ||
        !formData.patientEmail ||
        !formData.patientPhone
      ) {
        toast.error("Please fill all fields");
        setLoading(false);
        setPaymentProcessing(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.patientEmail)) {
        toast.error("Invalid email address");
        setLoading(false);
        setPaymentProcessing(false);
        return;
      }

      const phoneRegex = /^[0-9]{10,}$/;
      if (!phoneRegex.test(formData.patientPhone.replace(/[-\s]/g, ""))) {
        toast.error("Invalid phone number");
        setLoading(false);
        setPaymentProcessing(false);
        return;
      }

      // 2. Prepare the Unified Payload for SSLCommerz
      const payload = {
        docId,
        slotDate,
        slotTime,
        appointmentType: isVideo ? "video" : "offline",
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        patientPhone: formData.patientPhone,
      };

      // 3. Call initiate-payment endpoint
      const { data } = await axios.post(
        backendUrl + "/api/user/initiate-payment",
        payload,
        { headers: { token } } //authUser middleware will attach userId from this token
      );

      // 4. Handle the SSLCommerz Redirect
      if (data.success && data.url) {
        //Redirect user to the SSLCommerz payment page
        window.location.replace(data.url);
      } else {
        toast.error(data.message || "Failed to initialize payment gateway");
        setLoading(false);
        setPaymentProcessing(false);
      }
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to initiate booking"
      );
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const slotDateFormat = (slotDate) => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = [
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

    const dateArray = slotDate.split("_");
    const day = parseInt(dateArray[0]);
    const month = parseInt(dateArray[1]);
    const year = parseInt(dateArray[2]);

    const date = new Date(year, month - 1, day);
    const dayName = days[date.getDay()];

    return `${dayName}, ${day} ${months[month - 1]} ${year}`;
  };

  if (confirmationComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600">
              Your {displayType.toLowerCase()} is confirmed.{" "}
              {isVideo
                ? "Save your meeting link below."
                : "We look forward to seeing you at the clinic."}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {isVideo ? "Meeting Details" : "Appointment Details"}
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Doctor</p>
                <p className="text-lg font-semibold text-gray-800">
                  Dr. {docInfo?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="text-lg font-semibold text-gray-800">
                  {slotDateFormat(slotDate)} at {slotTime}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span>{" "}
              {isVideo
                ? "Join the meeting on the scheduled date and time. Make sure to have a stable internet connection and a quiet environment for the consultation."
                : "Please arrive at the clinic 10 minutes prior to your scheduled time to complete any necessary paperwork."}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            {isVideo && meetingLink && (
              <button
                onClick={() => navigate(`/video-meeting/${appointmentId}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Join Meeting Now
              </button>
            )}
            <button
              onClick={() => navigate("/my-appointments")}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              View Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{displayType}</h1>
        <p className="text-gray-600 mb-6">
          Complete your details to confirm the booking
        </p>

        {/* Appointment Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Appointment Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Doctor</p>
              <p className="text-lg font-semibold text-gray-800">
                Dr. {docInfo?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Speciality</p>
              <p className="text-lg font-semibold text-gray-800">
                {docInfo?.speciality}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-lg font-semibold text-gray-800">
                {slotDateFormat(slotDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="text-lg font-semibold text-gray-800">{slotTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fee</p>
              <p className="text-lg font-semibold text-green-600">
                ${docInfo?.fees}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="text-lg font-semibold text-gray-800">
                {displayType}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Details Form */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Your Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="patientEmail"
                value={formData.patientEmail}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="patientPhone"
                value={formData.patientPhone}
                onChange={handleInputChange}
                placeholder="Enter your 10-digit phone number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Payment Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Consultation Fee</span>
              <span className="text-lg font-semibold text-gray-800">
                ${docInfo?.fees}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Taxes & Charges</span>
              <span className="text-lg font-semibold text-gray-800">$0</span>
            </div>
            <div className="border-t border-blue-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  ${docInfo?.fees}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Before confirming:</span>{" "}
            {isVideo
              ? "Please ensure you have a stable internet connection and a working camera and microphone for the video consultation. After payment, you'll receive a video consultation link via email."
              : "Please confirm your availability to travel to the clinic at the scheduled date and time."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={submitPaymentConfirmation}
            disabled={loading || paymentProcessing}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
          >
            {paymentProcessing ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              <> Pay Now & Confirm Booking</>
            )}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationForm;
