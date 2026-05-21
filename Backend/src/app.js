import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import passport from "passport";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import { authLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.set("trust proxy", 1);

// Explicit CORS middleware — must be first so helmet never touches these headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: false }));

// Stripe webhook needs raw body BEFORE the global JSON parser
app.use("/api/checkout/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(passport.initialize());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API healthy" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/lesson", lessonRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
