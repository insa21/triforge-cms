// src/modules/projects/project.routes.js
import { Router } from "express";
import multer from "multer";

import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "./project.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const projectRouter = Router();

// ============================
// Multer pakai MEMORY STORAGE
// ============================
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File harus berupa gambar (JPG/PNG/WebP)."), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(), // <— TIDAK pakai disk
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB
  },
});

// ============================
// ROUTES
// ============================
projectRouter.get("/", listProjects);
projectRouter.get("/:id", getProject);

// CREATE & UPDATE pakai upload.single("image")
projectRouter.post("/", requireAuth, upload.single("image"), createProject);
projectRouter.put("/:id", requireAuth, upload.single("image"), updateProject);

projectRouter.delete("/:id", requireAuth, deleteProject);
