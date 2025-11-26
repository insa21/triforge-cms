// src/modules/projects/project.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

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
// Konfigurasi folder uploads
// ============================
const uploadsDir = path.join(process.cwd(), "uploads", "projects");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============================
// Konfigurasi Multer
// ============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // .jpg / .png / dll
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .toLowerCase();

    const uniqueName =
      base + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File harus berupa gambar (JPG/PNG/WebP)."), false);
  }
};

const upload = multer({
  storage,
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

// CREATE & UPDATE sekarang pakai upload.single("image")
projectRouter.post("/", requireAuth, upload.single("image"), createProject);
projectRouter.put("/:id", requireAuth, upload.single("image"), updateProject);

projectRouter.delete("/:id", requireAuth, deleteProject);
