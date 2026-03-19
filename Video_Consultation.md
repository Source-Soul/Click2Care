# Click2Care — Video Consultation + Jitsi + Cancellation/Refund (Branch Notes)

**Branch:** `videoConsultation_Appointment_VideoCalling_implementation_backend_Frontend`  
**Doc date:** March 18, 2026  
**Developer:** Jerin Jalal

**Scope:** What exists in this workspace right now (frontend + admin + backend). This is written to help you understand _what was implemented, where it lives, how to run it, and what still needs alignment_.

---

## 1) Installation / Setup Guide

This repo is a multi-app workspace:

- `backend/` — Express + MongoDB (Node)
- `frontend/` — Patient-facing React (Vite)
- `admin/` — Admin/Doctor React (Vite)

### 2.1 Prereqs

- Node.js (recommended: latest LTS)
- MongoDB connection (Atlas/local)

### 2.2 Backend install + run

```bash
cd backend
npm install
npm run server
```

- Starts on `PORT` (defaults to `4000`).

### 2.3 Frontend (patient) install + run

```bash
cd frontend
npm install
npm run dev
```

### 2.4 Admin (admin + doctor) install + run

```bash
cd admin
npm install
npm run dev
```

### 2.6 Packages added/used for video calling

- `@jitsi/react-sdk` is installed in **both** `frontend/` and `admin/`. It is the api package for Video Meeting Consultation Having All Meet features : Camera , Audio, Mute , Background Image, End Call, Screen Share and other features.

```bash
cd admin
npm install @jitsi/react-sdk
npm run dev
```

```bash
cd frontend
npm install @jitsi/react-sdk
npm run dev
```

- Backend uses `node-cron` It was installed for auto no-show detection instead of manually doing it. But some issues still remained for "no show detection" which needs to be debugged in future.

```bash
cd backend
npm install node-cron
npm run server
```

---

## 3) Feature Implemented

## 3.1 Patient can book a Video Consultation

### Appointment Type Selection

- **Location**: [frontend/src/pages/Appoinment.jsx](frontend/src/pages/Appoinment.jsx)
- **UI**: Two separate buttons - "Offline Consultation" and "Video Consultation"
- **Styling**: Primary color highlight on selection

### Video Consultation Booking Flow

```
Patient selects Video Consultation
    ↓
Chooses date/time from available slots
    ↓
System creates initial appointment
    ↓
Redirects to VideoConsultationForm
    ↓
Patient enters details (name, email, phone)
    ↓
Mock payment processing
    ↓
Meeting link generated
    ↓
Redirected to VideoMeeting page
```

## 3.2 Jitsi Meeting (patient + doctor)

Jitsi Meet is a free, open-source video conferencing tool at free cost. While it is easy to use and developer-friendly. Best for learning in project implementation. 

- Uses Jitsi via `@jitsi/react-sdk`.
- Embeds a Jitsi iframe and joins a room name derived from `appointmentId`.
- UI enforces a basic time window:
  - Join allowed from ~5 minutes before until 30 minutes after the scheduled time.

### Key Features Jitsi Meeting implemented

- ✅ **Unique Meeting Links**: Each appointment generates a unique meeting ID
- ✅ **Time-Based Access Control**: Meetings valid from -5 minutes (early) to +30 minutes (late)
- ✅ **Secure Authorization**: Only authorized doctor and patient can join
- ✅ **No-Show Detection**: Automatic detection if patient doesn't join (There is bug here. Needs to be fixed)
- ✅ **Real-Time Status**: Meeting status updates (waiting, active, expired)
- ✅ **Full Jitsi Features**: Video, audio, chat, screen sharing, recording
- ✅ **Graceful Error Handling**: Fallback options and retry logic
- ✅ **Doctor and Patient Interfaces**: Tailored UI for both roles
- Real-time join button activation in Doctor Portal 30 minutes before meeting starts.

## 🎥 Meeting Link Format

https://meet.jit.si/click2care_{appointmentId}_{timestamp}

### System Architecture

**Frontend**

- Doctor Panel : Implemented UI for Video meeting Page **Location**: [admin/src/pages/DoctorVideoMeeting.jsx](admin/src/pages/DoctorVideoMeeting.jsx)
- Patient Panel : Implemented UI for Video consultation Page **Location**: [frontend/src/pages/VideoMeeting.jsx](frontend/src/pages/VideoMeeting.jsx)
- Shared Video Meeting Logic

**Backend**

- meetingLink Generate
- Appointment validation
- Meeting status tracking
- API endpoints for lifecycle events

---

Patient Flow

```
My Appointments
   ↓
Click "Join Video Meeting"
   ↓
/video-meeting/:appointmentId
   ↓
VideoMeeting.jsx
```

Doctor Flow : The Link from backend is generated to "Join" Button when clicked it goes to video Meeting. The Join button only appeaars before 30min of meeting start. Other wise it shows wait.
The Doctor Video Meeting page is accessed from within appointments:

```
Doctor Panel
  ↓
Appointments (sidebar link)
  ↓
Click "Join Meeting" on video appointment
  ↓
Navigates to: /doctor/video-meeting/:appointmentId
  ↓
Video Meeting Page loads
```

## 3.3 Cancellation + refund

- Patient cancellation calls backend cancellation endpoint.
- Refund logic exists on backend and sets `refundAmount` and `refundStatus`.
- Doctor cancellation for **video consultations** uses the refund-aware cancellation flow.

### #### In-App Notification:

- React Toastify notifications
- Success/error messages
- Real-time status updates

## 3.4 DATABASE SCHEMA

### Appointment Model Updates

```javascript
{
  // Existing fields
  userId, docId, slotDate, slotTime, userData, docData,
  amount, date, cancelled, payment, isCompleted,

  // New fields
  appointmentType: 'video' | 'offline',
  isVideo: boolean,

  videoConsultationData: {
    patientName: string,
    patientEmail: string,
    patientPhone: string,
    meetingLink: string,
    meetingId: string
  },

  noShow: boolean,
  cancelledBy: 'patient' | 'doctor' | null,
  cancelledAt: timestamp,
  joinedAt: timestamp,
  leftAt: timestamp,

  refundAmount: number,
  refundStatus: 'pending' | 'processed' | 'failed'
}
```

---

## FILES MODIFIED/CREATED

### Backend Files Modified

- `backend/models/appointmentModel.js` - Added video fields
- `backend/controllers/userController.js` - Added new functions
- `backend/controllers/doctorController.js` - Added new functions
- `backend/routes/userRoute.js` - Added new routes
- `backend/routes/doctorRoute.js` - Added new routes
- `backend/server.js` - Added no-show detection initialization

### Backend Files Created

- `backend/utils/appointmentService.js` - Appointment logic (no-show, refund)
- `backend/utils/notificationService.js` - In APP Toaster notification

### Frontend Files Modified

- `frontend/src/pages/Appoinment.jsx` - Type selection + routing
- `frontend/src/pages/MyAppoinments.jsx` - Video + join button
- `frontend/src/App.jsx` - New routes

### Frontend Files Created

- `frontend/src/pages/VideoConsultationForm.jsx` - Patient details form
- `frontend/src/pages/VideoMeeting.jsx` - Jitsi video meeting page

### Admin Files Created

- `admin/src/pages/DoctorVideoMeeting.jsx` - Jitsi video meeting page

---

### 4.1 Frontend (patient)

**Appointment type selection + slot generation**

- `frontend/src/pages/Appoinment.jsx`
  - Adds `appointmentType` state (`offline` vs `video`).
  - Uses `toLocaleTimeString()` to generate display slot times.
  - For video bookings: navigates to `/video-consultation` and passes `{ docId, slotDate, slotTime, docInfo }` in route state.

**Video consultation form (patient details + mock payment + booking)**

- `frontend/src/pages/VideoConsultationForm.jsx`
  - Collects `patientName`, `patientEmail`, `patientPhone`.
  - Simulates payment (2s delay).
  - Calls `POST /api/user/create-video-consultation`.
  - On success, shows “Booking Confirmed” + a “Join Meeting Now” button.

**My appointments (join button + cancel button + meeting expired logic)**

- `frontend/src/pages/MyAppoinments.jsx`
  - Displays appointment-type badge.
  - For video appointments, shows:
    - “Join Video Meeting” button when not cancelled/no-show/completed and not expired.
    - “Meeting Expired” disabled button when the time window has passed.
  - Cancels via `POST /api/user/cancel-appointment` and shows refund reason if present.

**Video meeting page (Jitsi embed)**

- `frontend/src/pages/VideoMeeting.jsx` _(currently untracked in git)_
  - Loads appointment via `POST /api/user/appointment-details`.
  - Performs client-side time validation (-5 min to +30 min).
  - Joins Jitsi using `@jitsi/react-sdk`:
    - `domain="meet.jit.si"`
    - `roomName="click2care_${appointmentId}"`

**Routing**

- `frontend/src/App.jsx`
  - Adds routes:
    - `/video-consultation`
    - `/video-meeting/:appointmentId`

### 4.2 Admin app (doctor side)

**Doctor appointment list: join/cancel/complete video consultations**

- `admin/src/pages/Doctor/DoctorAppointments.jsx`
  - Detects video consultations via `item.isVideo || item.appointmentType === "video"`.
  - “Join” is enabled only within a computed time window.
  - Cancel action calls either:
    - `cancelVideoConsultation()` for video
    - `cancelAppointment()` for offline
  - Complete action calls either:
    - `completeVideoConsultation()` for video
    - `completeAppointment()` for offline

**Doctor video meeting page (Jitsi embed)**

- `admin/src/pages/Doctor/DoctorVideoMeeting.jsx`
  - Loads appointment via `POST /api/user/appointment-details` (using `dToken` as `token`).
  - Performs a basic time check.
  - Joins Jitsi using:
    - `domain="meet.jit.si"`
    - `roomName="click2care_${appointmentId}"`
  - On `readyToClose`, marks the video consultation completed via `POST /api/doctor/complete-video-consultation`.

**Doctor API calls**

- `admin/src/context/DoctorContext.jsx`
  - `cancelVideoConsultation()` → `POST /api/doctor/cancel-video-consultation`
  - `completeVideoConsultation()` → `POST /api/doctor/complete-video-consultation`
  - Contains helpers `markVideoMeetingJoined()` / `markVideoMeetingLeft()` which call user endpoints.

**Admin routing to doctor meeting**

- `admin/src/App.jsx`
  - Adds route: `/doctor/video-meeting/:appointmentId`

### 4.3 Backend (Express + MongoDB)

**Appointment schema extensions**

- `backend/models/appointmentModel.js`
  - `appointmentType: "offline" | "video"`
  - `isVideo: boolean`
  - `videoConsultationData: { patientName, patientEmail, patientPhone, meetingLink, meetingId }`
  - No-show/cancellation tracking: `noShow`, `cancelledBy`, `cancelledAt`, `joinedAt`, `leftAt`, `completedAt`
  - Refund: `refundAmount`, `refundStatus`

**Refund + cancellation + no-show cron**

- `backend/utils/appointmentService.js`
  - `initializeNoShowDetection()` runs every 5 minutes.
  - `calculateRefund()` implements refund policy.
  - `cancelAppointmentWithRefund()` cancels, sets refund fields, releases doctor slot, triggers notification.

**User controller: video consultation endpoints + join validation**

- `backend/controllers/userController.js`
  - Shared date/time parser: `parseSlotDateTime(slotDate, slotTime)` supports `HH:MM` and `HH:MM AM/PM`.
  - Booking:
    - `bookAppointment()` validates slot is not in the past.
  - Cancellation:
    - `cancelAppointment()` uses `cancelAppointmentWithRefund(..., "patient")`.
  - Video consultation:
    - `initiateVideoConsultation()` creates placeholder video appointment.
    - `createVideoConsultation()` creates _and confirms_ in one step, generates meeting link.
    - `confirmVideoConsultation()` updates patient details + meeting link.
    - `getAppointmentDetails()` for meeting pages.
    - `validateMeetingJoin()` checks if joining is within time window.
  - Join/leave:
    - `markAppointmentJoined()`
    - `markAppointmentLeft()`
    - `markAppointmentCompleted()`
    - `checkAndMarkNoShow()`

**Doctor controller: video consult cancel/complete**

- `backend/controllers/doctorController.js`
  - `cancelVideoConsultation()` uses refund-aware cancellation.
  - `completeVideoConsultation()` sets `isCompleted: true`.

**Routes**

- `backend/routes/userRoute.js` — user endpoints including video consult routes.
- `backend/routes/doctorRoute.js` — doctor endpoints for video consult.
- `backend/routes/adminRoute.js` / `backend/controllers/adminController.js` — admin cancellation exists but does not use refund flow.

**Server boot**

- `backend/server.js`
  - Calls `initializeNoShowDetection()` during startup.

---

## 5) API Surface (Relevant endpoints)

### 5.1 User (`/api/user/*`)

- `POST /book-appointment` — book offline appointment (with time validation).
- `GET /appointments` — list user appointments.
- `POST /cancel-appointment` — cancel appointment (refund-aware for patient).

Video consultation:

- `POST /initiate-video-consultation` — reserves slot and creates video appointment shell.
- `POST /create-video-consultation` — creates + confirms video appointment (patient details + mock payment).
- `POST /confirm-video-consultation` — confirm an already initiated appointment.
- `POST /appointment-details` — fetch appointment document.
- `POST /validate-meeting-join` — time-window join validation.
- `POST /mark-joined` — mark joined (for no-show tracking).
- `POST /mark-left` — mark left (also sets completed).
- `POST /mark-completed` — mark completed.
- `POST /check-no-show` — manual no-show check.

### 5.2 Doctor (`/api/doctor/*`)

- `GET /appointments` — list doctor appointments.
- `POST /cancel-appointment` — cancels offline appointment (not refund-aware).
- `POST /complete-appointment` — completes offline appointment.

Video consultation:

- `POST /video-consultations` — list video consultations.
- `POST /cancel-video-consultation` — cancel video consultation (refund-aware).
- `POST /complete-video-consultation` — mark video consultation completed.

### 5.3 Admin (`/api/admin/*`)

- `GET /appointments` — list all appointments.
- `POST /cancel-appointment` — cancels appointment (not refund-aware).

---

## 6) Jitsi “Whole Thing” — How it currently works

### 6.1 What the frontend actually uses

Both patient and doctor meeting pages:

- Join via `@jitsi/react-sdk` with:
  - `domain="meet.jit.si"`
  - `roomName="click2care_${appointmentId}"`

### 6.2 What the backend generates

Backend generates/stores meeting links like:

- `https://meet.jitsi.org/click2care_<appointmentId>_<timestamp>`

…and stores:

- `appointment.videoConsultationData.meetingLink`
- `appointment.videoConsultationData.meetingId`

### 7.1 Refund policy

Implemented in `backend/utils/appointmentService.js` (`calculateRefund()`):

- **6+ hours before**: full refund (`refundAmount = amount`)
- **0–6 hours before**: 50% refund
- **After time passed**: not eligible

### 7.2 Patient cancellation

- Frontend: `frontend/src/pages/MyAppoinments.jsx` calls `POST /api/user/cancel-appointment`.
- Backend: `backend/controllers/userController.js` uses `cancelAppointmentWithRefund()`.

### 7.3 Doctor cancellation

Two paths exist:

- Offline cancel: `POST /api/doctor/cancel-appointment` → marks cancelled only (no refund)
- Video cancel: `POST /api/doctor/cancel-video-consultation` → refund-aware cancellation

### 7.4 Admin cancellation

- `POST /api/admin/cancel-appointment` cancels and releases slot, but does not set refund fields.

---

## 8) No-Show Logic

### 8.1 Background cron

- Initialized in `backend/server.js` via `initializeNoShowDetection()`.
- Runs every 5 minutes.
- Marks appointment as no-show if:
  - Not cancelled, not completed
  - Not already marked no-show
  - More than 10 minutes after scheduled time
  - And `joinedAt` is not set

### 8.2 Join tracking (current)

Backend supports join tracking via:

- `POST /api/user/mark-joined`
- `POST /api/user/mark-left`

But the current **meeting pages** (patient and doctor) do not call those endpoints, so `joinedAt` may never be set, which can cause incorrect no-show marking.

---

## 9) Known Gaps / Things to Fix Next (Recommended)

These are not “new features”; they’re consistency fixes to make the current system reliable.

1. **Time parsing consistency**
   - Some backend logic parses `slotTime` as `HH:MM` only (`split(":")`), while frontend often uses locale strings like `"08:30 AM"`.
   - Recommended: reuse the same parser (like `parseSlotDateTime`) everywhere (including cron and meeting validation).

2. **Meeting room single source-of-truth**
   - Meeting pages should join the exact `meetingId` stored on the appointment.
   - Decide one Jitsi domain (`meet.jit.si` vs `meet.jitsi.org`) and use it consistently.

3. **No-show accuracy**
   - Wire meeting pages to call `mark-joined`/`mark-left` so the cron doesn’t mark attended calls as no-show.

4. **Cancellation duplication**
   - `cancelAppointmentWithRefund()` already sends a cancellation notification, but `userController.cancelAppointment()` sends one again.
   - Recommended: send once (either in service or controller, not both).

5. **Admin/doctor offline cancellation refund parity**
   - Admin cancellation and doctor offline cancellation currently bypass refund logic.

---
