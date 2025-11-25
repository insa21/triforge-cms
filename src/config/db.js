// src/config/db.js
// import { PrismaClient } from "@prisma/client";

// export const prisma = new PrismaClient();

// src/config/db.js
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

// konfigurasi WebSocket untuk Neon
neonConfig.webSocketConstructor = ws;

// buat pool Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// adapter Prisma untuk Neon
const adapter = new PrismaNeon(pool);

// inisiasi Prisma Client dengan adapter Neon
// supaya tidak bikin banyak instance di serverless, bisa pakai pattern global
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export { prisma };
