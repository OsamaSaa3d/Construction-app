import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma client.");
  }

  const pgPool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      keepAlive: true,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

  pgPool.on("error", (error) => {
    console.error("Postgres pool error", error);
  });

  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = pgPool;
  }

  const adapter = new PrismaPg(pgPool, {
    onConnectionError: (error) => {
      console.error("PrismaPg connection error", error);
    },
    onPoolError: (error) => {
      console.error("PrismaPg pool error", error);
    },
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
