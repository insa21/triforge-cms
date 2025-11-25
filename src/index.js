import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { apiRouter } from "./routes/index.js";

const app = express();

// middleware global
app.use(cors());
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Triforge backend (local mode)",
  });
});

// routes utama
app.use("/api", apiRouter);

// error fallback
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(env.port, () => {
  console.log(`🚀 Local server running on port ${env.port}`);
});
