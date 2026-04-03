# 🩺 Click2Care – A Doctor's Appointment Booking Website

Click2Care is a full-stack doctor appointment booking platform built using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)**. It simplifies the process of scheduling medical consultations by connecting patients with doctors through an intuitive and secure system.

---
##  Project Demo

Check out the live demo of Click2Care here: https://youtu.be/3QUIXJbi7WM?si=pC7PmRtQ483FWn4b

##  Features

###  User Roles

Click2Care supports three types of users:

* **Patients**
* **Doctors**
* **Admin**

Each role has specific permissions and functionalities within the system.

---

###  Patient Features

* Register & login securely
* Browse doctors by **categories/specializations**
* Book appointments (Online / Offline)
* View doctor availability and time slots
* Manage appointments (view/cancel)
* Access consultation history

---

###  Doctor Features

* Secure authentication system
* Set availability and consultation schedule
* Manage appointments
* Choose consultation type (Online / Offline)
* View patient details and booking history

---

###  Admin Features

* Manage users (patients & doctors)
* Add/edit/remove doctor categories
* Monitor appointments
* Maintain system integrity and data

---

##  Appointment System

* Real-time **doctor schedule management**
* Slot-based booking system
* Supports:

  *  Online Consultation
  *  Offline (In-person) Consultation
* Prevents double booking

---

##  Authentication & Security

* Fully functional authentication system
* Role-based access control
* Secure login & registration
* Protected routes for all user roles

---

##  Tech Stack

### Frontend

* React.js
* CSS / Tailwind (optional)

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Other Tools

* JWT (Authentication)
* REST APIs

---

##  Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/click2care.git
cd click2care
```

### 2. Setup Backend

```bash
cd backend
npm install
npm start
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```

---

##  Environment Variables

Create a `.env` file in the server directory:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 📌 Future Enhancements

* Video consultation integration (done)
* Payment gateway integration
* Notifications (Email/SMS)
* Doctor ratings & reviews
* Mobile app version

---

##  Conclusion

Click2Care aims to make healthcare access easier by providing a seamless appointment booking experience for patients, doctors, and administrators.

---

