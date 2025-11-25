// src/index.js
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
    message:
      "Triforge backend running (PostgreSQL + Prisma + Auth + Projects + Contact)",
  });
});

// routes utama
app.use("/api", apiRouter);

// error fallback (optional)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ❗❗ TIDAK ADA app.listen & process.on di sini
// Hanya export app (dan kalau mau prisma/env)
export { app, prisma, env };
export default app;
