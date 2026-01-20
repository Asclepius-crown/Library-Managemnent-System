//
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from "./config.js";
import authRoutes from "./routes/auth.js"; // Corrected import path
import booksRoutes from "./routes/books.js";
import borrowedRoutes from "./routes/borrowed.js";
// import overdueRoutes from './routes/overdue.js';
import studentRoutes from "./routes/students.js";
import googleBooksRoutes from "./routes/googleBooks.js";
import usersRoutes from "./routes/users.js"; // Import users routes
import dashboardRoutes from "./routes/dashboard.js"; // Import dashboard routes
import reservationRoutes from "./routes/reservations.js";
import reviewRoutes from "./routes/reviews.js";
import analyticsRoutes from "./routes/analytics.js";
import announcementRoutes from "./routes/announcements.js";
import adminToolsRoutes from "./routes/adminTools.js";
import errorHandler from './middleware/errorHandler.js';
import { initNotificationScheduler } from './utils/notificationScheduler.js';

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cors());
app.use(express.json());

mongoose
  .connect(config.MONGO_URI, {
    family: 4, // Force IPv4 to fix ENOTFOUND/DNS issues
  })
  .then(() => {
    console.log("MongoDB connected");
    initNotificationScheduler();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/borrowed", borrowedRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/dashboard", dashboardRoutes); // Use dashboard routes
app.use("/api/google-books", googleBooksRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/admin-tools", adminToolsRoutes);

app.get("/", (_req, res) => res.send("Athenaeum backend API running"));

// Error Handling Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => console.log(`Server listening on port ${config.PORT}`));
}

export default app;
