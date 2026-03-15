# NEU MOA Monitoring System

A web-based Memoranda of Agreement (MOA) Monitoring System for New Era University, built with React and Firebase. This system allows students, faculty, and administrators to manage and track MOA partnerships between NEU and its industry partners.

---

## 🌐 Live Demo
https://neu-moa-monitoring-556b5.web.app

---

## ✨ Features

### Student Portal
- View all approved MOA industry partners
- Search and filter by college, industry, or company name
- View partner details including address, contact person, and email

### Faculty Portal
- View all MOA records including processing, expired, and expiring
- Add, edit, and delete MOA entries
- Full audit trail of all changes

### Admin Portal
- Full access to all MOA records including soft-deleted entries
- Manage and block/unblock users
- View complete audit trail
- Load CICS OJT partner companies into the database

---

## 🛠 Tech Stack
- **Frontend:** React.js
- **Backend:** Firebase Firestore
- **Authentication:** Firebase Auth (Google Sign-In)
- **Hosting:** Firebase Hosting

---

## 👥 User Roles

| Role | Access |
|---|---|
| Student | Approved MOAs only |
| Faculty | All MOAs + Add/Edit/Delete |
| Admin | Full access + User management |

---

## 📋 MOA Statuses
- APPROVED: Signed by President
- APPROVED: On-going notarization
- APPROVED: No notarization needed
- PROCESSING: Awaiting signature by HTE partner
- PROCESSING: MOA draft sent to Legal Office
- PROCESSING: Sent to VPAA/OP for approval
- EXPIRED: No renewal done
- EXPIRING: Two months before expiration

---

## 🚀 Setup & Installation

### 1. Clone the repository
git clone https://github.com/MicoleKurt/NEU-MOA-PROJECT.git
cd NEU-MOA-PROJECT

### 2. Install dependencies
npm install

### 3. Add Firebase config
Open src/firebase/config.js and paste your Firebase project credentials.

### 4. Run locally
npm start

### 5. Build and deploy
npm run build
firebase deploy

---

## 🔑 Setting Up Admin Account
1. Sign in to the app at localhost:3000 using your @neu.edu.ph Google account
2. Go to Firebase Console → Firestore Database → moa_users collection
3. Find your document → change role field from student to admin
4. Refresh the app — Admin Dashboard will appear

---

## 📁 Project Structure

neu-moa/
├── src/
│   ├── firebase/
│   │   └── config.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── data/
│   │   └── seedMOAs.js
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── AdminDashboard.js
│   │   ├── FacultyDashboard.js
│   │   └── StudentDashboard.js
│   └── App.js
├── public/
│   └── index.html
├── firebase.json
└── package.json

---

## 👩‍💻 Developer
**Micole Kurt Gonda**
New Era University — College of Informatics and Computing Studies (CICS)
Professional Elective 2 — Personal Project
Academic Year 2025–2026

---

© 2026 New Era University · All rights reserved
