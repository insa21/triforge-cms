import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { prisma } from "./config/db.js";

// Wajib: hapus app.listen() → Vercel tidak butuh itu
const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend Serverless on Vercel",
  });
});

// routes
app.use("/api", apiRouter);

// Vercel: export sebagai ONE API handler
export default app;
