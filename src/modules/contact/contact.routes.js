// src/modules/contact/contact.routes.js
import { Router } from "express";
import {
  createContactMessage,
  listContactMessages,
  getContactMessage,
  updateContactMessage,
  deleteContactMessage,
} from "./contact.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const contactRouter = Router();

// PUBLIC: dipakai form di website
contactRouter.post("/", createContactMessage);

// ADMIN: butuh login
contactRouter.get("/", requireAuth, listContactMessages);
contactRouter.get("/:id", requireAuth, getContactMessage);
contactRouter.put("/:id", requireAuth, updateContactMessage);
contactRouter.delete("/:id", requireAuth, deleteContactMessage);
