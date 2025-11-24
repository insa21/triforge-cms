// prisma/seed.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEGMENTS = [
  { slug: "web-app", label: "Web App & Sistem" },
  { slug: "ai-automation", label: "AI & Automation" },
  { slug: "dashboard-data", label: "Dashboard & Data" },
  { slug: "portal-community", label: "Portal & Komunitas" },
  { slug: "content-campaign", label: "Landing & Campaign" },
  { slug: "education-health", label: "Education & Healthcare" },
];

async function main() {
  for (const seg of SEGMENTS) {
    await prisma.segment.upsert({
      where: { slug: seg.slug },
      update: { label: seg.label },
      create: seg,
    });
  }
  console.log("✅ Segments seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
