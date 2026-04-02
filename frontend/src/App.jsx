import React, { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AppContext } from "./context/AppContext";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyAppoinments from "./pages/MyAppoinments";
import MyProfile from "./pages/MyProfile";
import Navbar from "./components/Navbar";
import Fotter from "./components/Fotter";
import Appoinment from "./pages/Appoinment";
import VideoConsultationForm from "./pages/VideoConsultationForm";
import VideoMeeting from "./pages/VideoMeeting";
import ProfileSetup from "./pages/ProfileSetup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const { token } = useContext(AppContext);

  return (
    <div className="mx-4 sm:mx-[10%]">
      <ToastContainer />
      <Navbar />

      <Routes>
        {/* ১. টোকেন থাকলে প্রোফাইল সেটআপে যাবে, না থাকলে লগইনে */}
        <Route
          path="/"
          element={token ? <Navigate to="/profile-setup" /> : <Login />}
        />

        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/home" element={<Home />} />

        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:speciality" element={<Doctors />} />
        <Route
          path="/login"
          element={token ? <Navigate to="/profile-setup" /> : <Login />}
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/my-appointments" element={<MyAppoinments />} />
        <Route path="/appoinment/:docId" element={<Appoinment />} />
        <Route path="/video-consultation" element={<VideoConsultationForm />} />
        <Route
          path="/video-meeting/:appointmentId"
          element={<VideoMeeting />}
        />
      </Routes>
      <Fotter />
    </div>
  );
};

export default App;
