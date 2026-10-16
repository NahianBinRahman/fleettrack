import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// If running in a Vercel Serverless environment, ensure SQLite db is copied to writable /tmp
if (process.env.VERCEL) {
  const tmpDb = path.join("/tmp", "dev.db");
  const seedDb = path.join(process.cwd(), "prisma", "dev.db");

  if (!fs.existsSync(tmpDb) && fs.existsSync(seedDb)) {
    try {
      fs.copyFileSync(seedDb, tmpDb);
    } catch (e) {
      console.error("Vercel SQLite init error:", e);
    }
  }

  if (fs.existsSync(tmpDb)) {
    process.env.DATABASE_URL = `file:${tmpDb}`;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

