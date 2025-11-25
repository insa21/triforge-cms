import express from "express";
import cors from "cors";
// import env, db, router …
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Triforge backend running" });
});
app.use("/api", apiRouter); // kalau yakin apiRouter aman
export default app;
