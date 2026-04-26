import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import assessmentRoutes from "./routes/assessment.routes";
import chatRoutes from "./routes/chat.routes";
// import resultsRoutes from "./routes/results.routes";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://skillscout-server.web.app",
  "https://skillscout-server.firebaseapp.com",
  "https://deccanai.ritik.world"
].filter(Boolean) as string[];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/chat", chatRoutes);
// app.use("/api/results", resultsRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

export default app;
