// src/modules/segments/segment.controller.js
import { prisma } from "../../config/db.js";
import { z } from "zod";

const segmentCreateSchema = z.object({
  slug: z.string().min(2, "Slug minimal 2 karakter"), // contoh: "web-app"
  label: z.string().min(3, "Label minimal 3 karakter"), // contoh: "Web App & Sistem"
});

const segmentUpdateSchema = segmentCreateSchema.partial();

export async function listSegments(req, res) {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { id: "asc" },
    });

    const dto = [
      { id: "all", label: "Semua kategori" },
      ...segments.map((s) => ({
        id: s.slug,
        label: s.label,
      })),
    ];

    return res.json(dto);
  } catch (err) {
    console.error("List segments error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSegment(req, res) {
  try {
    const { slug } = req.params;

    const segment = await prisma.segment.findUnique({
      where: { slug },
    });

    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }

    return res.json(segment);
  } catch (err) {
    console.error("Get segment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createSegment(req, res) {
  try {
    const parsed = segmentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { slug, label } = parsed.data;

    const existing = await prisma.segment.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ message: "Slug sudah dipakai" });
    }

    const segment = await prisma.segment.create({
      data: { slug, label },
    });

    return res.status(201).json(segment);
  } catch (err) {
    console.error("Create segment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateSegment(req, res) {
  try {
    const { slug } = req.params;

    const parsed = segmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.segment.findUnique({ where: { slug } });
    if (!existing) {
      return res.status(404).json({ message: "Segment not found" });
    }

    const data = parsed.data;

    // kalau slug diganti, cek bentrok
    if (data.slug && data.slug !== slug) {
      const dup = await prisma.segment.findUnique({
        where: { slug: data.slug },
      });
      if (dup) {
        return res.status(409).json({ message: "Slug baru sudah dipakai" });
      }
    }

    const updated = await prisma.segment.update({
      where: { slug },
      data: {
        slug: data.slug ?? existing.slug,
        label: data.label ?? existing.label,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("Update segment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteSegment(req, res) {
  try {
    const { slug } = req.params;

    const existing = await prisma.segment.findUnique({ where: { slug } });
    if (!existing) {
      return res.status(404).json({ message: "Segment not found" });
    }

    // NOTE: kalau masih ada project pakai segment ini, Prisma bisa error (FK constraint)
    // Untuk simpel, langsung coba delete — kalau error, kirim pesan
    try {
      await prisma.segment.delete({ where: { slug } });
    } catch (err) {
      console.error("Delete segment FK error:", err);
      return res.status(400).json({
        message:
          "Tidak bisa hapus segment karena masih dipakai project. Hapus / ubah project dulu.",
      });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("Delete segment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
