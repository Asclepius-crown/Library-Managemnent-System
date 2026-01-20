# 🏛️ The Athenaeum | Next-Gen Library System

> **"Knowledge, organized for the digital age."**

![System Status](https://img.shields.io/badge/System-Online-success?style=for-the-badge&logo=statuspage)
![Tech Stack](https://img.shields.io/badge/MERN-Stack-blueviolet?style=for-the-badge&logo=react)
![UI](https://img.shields.io/badge/UI-Glassmorphism-cyan?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

---

## 🔮 Overview

**The Athenaeum** is not just a library management system; it is a modern digital interface designed to bridge the gap between physical archives and digital workflows. Built with performance and aesthetics in mind, it features a **Futuristic Glassmorphism UI**, real-time data visualization, and a seamless user experience for both Administrators and Students.

![Dashboard Preview](https://via.placeholder.com/1000x500/0f172a/38bdf8?text=Admin+Dashboard+Preview)
*(Admin Dashboard showcasing real-time analytics and user management)*

---

## 🚀 Key Modules

### 1. 🌌 The Command Center (Admin Dashboard)
A visually stunning, high-tech dashboard for full system oversight.
-   **Glassmorphism Design:** Semi-transparent cards with ambient gradient glows (Blue/Purple/Cyan).
-   **Real-Time Analytics:** Visual charts for borrowing trends and genre distribution.
-   **User Management:** detailed table with **Promote/Demote** and **Delete User** capabilities.
-   **Inventory Control:** Add, edit, and bulk-delete books.

### 2. 📚 The Smart Catalog
A friction-less browsing experience for students.
-   **Live Search:** Instant filtering with debounced search logic.
-   **Tunnel-Free Navigation:** Innovative **"Click-to-Lock"** selection mechanism prevents accidental hover switching while viewing details.
-   **Deep Inspection:** A dedicated "Inspector Pane" for detailed book data, availability status, and actions.
-   **Tag Cloud:** Quick filtering by engineering disciplines and genres.

![Catalog Preview](https://via.placeholder.com/1000x500/0f172a/c084fc?text=Smart+Catalog+Preview)
*(Interactive Catalog with live search and detailed book inspector)*

### 3. 🔐 Security & Access
-   **Role-Based Access Control (RBAC):** Distinct interfaces for Admins and Students.
-   **Secure Authentication:** JWT-based sessions with protected routes.
-   **Audit Ready:** Tracks borrowing history, due dates, and reservation queues.

---

## 🛠️ System Architecture

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | High-performance, component-based UI. |
| **Styling** | TailwindCSS | Utility-first styling with custom glass effects. |
| **Backend** | Node.js + Express | Scalable REST API with rate limiting & security headers. |
| **Database** | MongoDB | Flexible schema for Books, Users, and Transactions. |
| **Icons** | Lucide React | Clean, modern vector iconography. |

---

## ⚡ Initialization Protocol

Follow these steps to deploy the system locally.

### Prerequisites
-   Node.js (v18+)
-   MongoDB (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/Asclepius-crown/Library-Managemnent-System.git
cd Library-Managemnent-System
```

### 2. Backend Initialization
```bash
cd Backend
npm install
# Create a .env file with:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# PORT=3000
npm run dev
```

### 3. Frontend Initialization
```bash
cd ../vite-project
npm install
npm run dev
```

> **Note:** The system uses a proxy configuration. Ensure the backend is running on port 3000 (or update `vite.config.js`).

---

## 📂 Project Structure

```bash
root/
├── Backend/             # Server-side logic
│   ├── controllers/     # Business logic
│   ├── models/          # Mongoose schemas
│   └── routes/          # API endpoints
├── vite-project/        # Client-side application
│   ├── src/
│   │   ├── component/   # React components (Admin, Catalog, Auth)
│   │   └── api/         # Axios configuration
└── README.md            # System Documentation
```

---

## ⚠️ COPYRIGHT NOTICE

**&copy; 2026 The Athenaeum Project by Amit Raj. All Rights Reserved.**

This software and its associated documentation files (the "Software") are the proprietary property of **Amit Raj**.

**Unauthorized copying, modification, distribution, or use of this file or any portion of this project, via any medium, is strictly prohibited.**
The concepts, design, and implementation contained herein are intellectual property.

---

<div align="center">
  <sub>Designed & Developed by Amit Raj</sub>
  <br />
  <sub>&copy; 2026 The Athenaeum Project</sub>
</div>