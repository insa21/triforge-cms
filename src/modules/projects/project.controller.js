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

// Helper: dari file (buffer) jadi data URL base64
function fileToDataUrl(file) {
  if (!file) return null;
  const mime = file.mimetype || "image/jpeg";
  const base64 = file.buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
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
    // Semua field body datang sebagai string (multipart/form-data)
    const body = { ...req.body };

    // Normalisasi tags (jadi array string)
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
      image: imageFromBody,
      imageAlt,
    } = parsed.data;

    // ==============================
    // Handle IMAGE (file / string)
    // ==============================
    let finalImage = null;

    // 1) Kalau ada file dari multer → jadikan data URL base64
    if (req.file) {
      finalImage = fileToDataUrl(req.file);
    }

    // 2) Kalau tidak ada file tapi body.image ada → pakai string itu (URL / base64)
    if (!finalImage && typeof imageFromBody === "string") {
      const trimmed = imageFromBody.trim();
      if (trimmed) {
        finalImage = trimmed;
      }
    }

    // 3) Kalau tetap kosong → error
    if (!finalImage) {
      return res.status(400).json({
        message:
          "Gambar wajib diisi. Upload file (field 'image') atau kirim string di field 'image'.",
      });
    }

    // Cari segment
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
        image: finalImage, // <— string (URL / data URL base64)
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

    // Normalisasi tags
    const normalizedTags = normalizeTags(body.tags);
    if (normalizedTags) {
      body.tags = normalizedTags;
    } else if (body.tags !== undefined) {
      // kalau dikirim tapi kosong → []
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

    // ==============================
    // Handle segment (slug → id)
    // ==============================
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

    // ==============================
    // Handle IMAGE update
    // ==============================
    let finalImage = existing.image;

    // 1) Kalau ada file baru → override dengan base64
    if (req.file) {
      finalImage = fileToDataUrl(req.file);
    }
    // 2) Kalau tidak ada file, tapi ada field image di body
    else if (Object.prototype.hasOwnProperty.call(data, "image")) {
      if (typeof data.image === "string" && data.image.trim()) {
        finalImage = data.image.trim(); // bisa URL / base64
      }
      // Kalau dikirim kosong, kita biarkan existing.image (tidak dihapus)
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
        image: finalImage,
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

    // (opsional) kalau dulu sempat simpan ke disk, di sini bisa ditambah fs.unlink

    return res.status(204).send();
  } catch (err) {
    console.error("Delete project error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
