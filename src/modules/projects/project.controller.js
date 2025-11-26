// src/modules/projects/project.controller.js
import { prisma } from "../../config/db.js";
import { projectCreateSchema, projectUpdateSchema } from "./project.schema.js";

// DTO mapper: FE tetap terima field yang sama
const mapProjectToDto = (project) => ({
  id: project.id,
  segment: project.segment.slug,
  category: project.category,
  title: project.title,
  result: project.result,
  details: project.details,
  tags: project.tags ? JSON.parse(project.tags) : [],
  image: project.image,
  imageAlt: project.imageAlt,
});

// Helper: normalisasi tags dari body (array / JSON string / "a, b, c")
function normalizeTags(raw) {
  if (raw === undefined || raw === null) return undefined;

  // Kalau sudah array
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t));
  }

  const str = String(raw).trim();
  if (!str) return undefined;

  // Coba parse JSON dulu
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map((t) => String(t));
    }
  } catch {
    // ignore
  }

  // Fallback: pisah koma
  return str
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function listProjects(req, res) {
  try {
    const { segment } = req.query;

    const where =
      segment && segment !== "all" ? { segment: { slug: segment } } : {};

    const projects = await prisma.project.findMany({
      where,
      include: { segment: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(projects.map(mapProjectToDto));
  } catch (err) {
    console.error("List projects error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProject(req, res) {
  try {
    const id = Number(req.params.id);

    const project = await prisma.project.findUnique({
      where: { id },
      include: { segment: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(mapProjectToDto(project));
  } catch (err) {
    console.error("Get project error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createProject(req, res) {
  try {
    // Semua field body datang sebagai string karena multipart/form-data
    const body = { ...req.body };

    const normalizedTags = normalizeTags(body.tags);
    if (normalizedTags) {
      body.tags = normalizedTags;
    } else {
      delete body.tags;
    }

    const parsed = projectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      segment,
      category,
      title,
      result,
      details,
      tags = [],
      imageAlt,
    } = parsed.data;

    // Sekarang gambar wajib diupload lewat file
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Gambar (field 'image') wajib diupload." });
    }

    const imagePath = `/uploads/projects/${req.file.filename}`;

    const seg = await prisma.segment.findUnique({
      where: { slug: segment },
    });

    if (!seg) {
      return res.status(400).json({
        message: `Segment '${segment}' tidak ditemukan`,
      });
    }

    const created = await prisma.project.create({
      data: {
        segmentId: seg.id,
        category,
        title,
        result,
        details,
        tags: JSON.stringify(tags),
        image: imagePath,
        imageAlt: imageAlt || title,
      },
      include: { segment: true },
    });

    return res.status(201).json(mapProjectToDto(created));
  } catch (err) {
    console.error("Create project error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProject(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.project.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ message: "Project not found" });
    }

    const body = { ...req.body };

    const normalizedTags = normalizeTags(body.tags);
    if (normalizedTags) {
      body.tags = normalizedTags;
    } else if (body.tags !== undefined) {
      // kalau tags dikirim kosong, kita akan pakai [] (bukan existing.tags)
      body.tags = [];
    } else {
      delete body.tags;
    }

    const parsed = projectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    let segmentId = existing.segmentId;
    if (data.segment) {
      const seg = await prisma.segment.findUnique({
        where: { slug: data.segment },
      });
      if (!seg) {
        return res.status(400).json({
          message: `Segment '${data.segment}' tidak ditemukan`,
        });
      }
      segmentId = seg.id;
    }

    // Kalau ada file baru, ganti image path. Kalau tidak, pakai yang lama.
    let imagePath = existing.image;
    if (req.file) {
      imagePath = `/uploads/projects/${req.file.filename}`;
      // NOTE: kalau mau sekalian hapus file lama di disk, tinggal tambahkan fs.unlink di sini.
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        segmentId,
        category: data.category ?? existing.category,
        title: data.title ?? existing.title,
        result: data.result ?? existing.result,
        details: data.details ?? existing.details,
        tags:
          data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags,
        image: imagePath,
        imageAlt: data.imageAlt ?? existing.imageAlt,
      },
      include: { segment: true },
    });

    return res.json(mapProjectToDto(updated));
  } catch (err) {
    console.error("Update project error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteProject(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.project.delete({ where: { id } });

    // Optional: kalau mau, bisa hapus file gambar fisiknya di sini.

    return res.status(204).send();
  } catch (err) {
    console.error("Delete project error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
