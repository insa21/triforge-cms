// src/modules/projects/project.schema.js
import { z } from "zod";

const projectBaseSchema = z.object({
  segment: z.string().min(1, "Segment wajib diisi"), // slug segment
  category: z.string().min(2, "Kategori wajib diisi"),
  title: z.string().min(3, "Judul minimal 3 karakter"),
  result: z.string().min(5, "Result minimal 5 karakter"),
  details: z.string().min(5, "Details minimal 5 karakter"),
  // tags akan dinormalisasi dulu di controller (bisa kirim array / string / JSON / "a, b, c")
  tags: z.array(z.string()).optional(),
  // image bisa berupa URL atau data URL base64
  image: z.string().optional(),
  imageAlt: z.string().optional(),
});

export const projectCreateSchema = projectBaseSchema;
export const projectUpdateSchema = projectBaseSchema.partial();
