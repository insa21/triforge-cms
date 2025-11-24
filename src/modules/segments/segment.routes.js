// src/modules/segments/segment.routes.js
import { Router } from "express";
import {
  listSegments,
  getSegment,
  createSegment,
  updateSegment,
  deleteSegment,
} from "./segment.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const segmentRouter = Router();

// PUBLIC
segmentRouter.get("/", listSegments);
segmentRouter.get("/:slug", getSegment);

// PROTECTED (butuh token admin)
segmentRouter.post("/", requireAuth, createSegment);
segmentRouter.put("/:slug", requireAuth, updateSegment);
segmentRouter.delete("/:slug", requireAuth, deleteSegment);
