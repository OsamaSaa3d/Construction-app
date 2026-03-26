import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbPath = process.env.DATABASE_URL ?? "file:./dev.db";

  // Resolve relative file: paths to absolute for libsql
  let url = dbPath;
  if (dbPath.startsWith("file:./")) {
    const relative = dbPath.replace("file:./", "");
    url = "file:" + path.resolve(process.cwd(), relative);
  }

  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
