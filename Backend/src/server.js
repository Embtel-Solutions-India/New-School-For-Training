import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import configurePassport from "./config/passport.js";
import { setIo } from "./services/socketService.js";

// Must run after dotenv.config() — ESM hoisting means module-level calls in app.js
// would execute before .env is loaded, so passport is configured here instead.
configurePassport();

console.log({
  clientLoaded: !!process.env.GOOGLE_CLIENT_ID,
  secretLoaded: !!process.env.GOOGLE_CLIENT_SECRET,
  redirect: process.env.GOOGLE_REDIRECT_URI,
});

const port = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const startServer = async () => {
  await connectDB();

  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  setIo(io);

  io.on("connection", (socket) => {
    socket.on("join-user-room", (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("leave-user-room", (userId) => {
      if (userId) socket.leave(`user:${userId}`);
    });

    socket.on("join-community", (courseId) => {
      if (courseId) socket.join(`community:${courseId}`);
    });

    socket.on("leave-community", (courseId) => {
      if (courseId) socket.leave(`community:${courseId}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`✓ Auth server running`);
    console.log(`✓ Server listening on port ${port}  [${process.env.NODE_ENV || "development"}]`);

    const s3Ready = !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      process.env.AWS_S3_BUCKET_NAME
    );
    if (s3Ready) console.log("✓ Upload service ready");
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
