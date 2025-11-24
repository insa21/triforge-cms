// src/modules/contact/contact.controller.js
import { prisma } from "../../config/db.js";
import { contactSchema } from "./contact.schema.js";

export async function createContactMessage(req, res) {
  try {
    const parsed = contactSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    const created = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp ?? null,
        message: data.message,
      },
    });

    return res.status(201).json({
      message: "Pesan terkirim",
      id: created.id,
    });
  } catch (err) {
    console.error("Create contact message error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// LIST semua pesan (admin)
export async function listContactMessages(req, res) {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(messages);
  } catch (err) {
    console.error("List contact messages error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DETAIL satu pesan
export async function getContactMessage(req, res) {
  try {
    const id = Number(req.params.id);

    const msg = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!msg) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    return res.json(msg);
  } catch (err) {
    console.error("Get contact message error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// UPDATE pesan (misal koreksi, atau nanti tambahin field status)
export async function updateContactMessage(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    // boleh partial: semua field optional
    const parsed = contactSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        email: data.email ?? existing.email,
        whatsapp: data.whatsapp ?? existing.whatsapp,
        message: data.message ?? existing.message,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("Update contact message error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE pesan
export async function deleteContactMessage(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    await prisma.contactMessage.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    console.error("Delete contact message error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
