import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Check if we're using Turso (production)
  if (
    process.env.TURSO_AUTH_TOKEN &&
    process.env.DATABASE_URL?.includes("turso.io")
  ) {
    // Turso with driver adapter (requires @libsql/client)
    try {
      const { PrismaLibSQL } = require("@prisma/adapter-libsql");
      const { createClient } = require("@libsql/client");

      const libsql = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      const adapter = new PrismaLibSQL(libsql);
      console.log("✅ Using Turso database");
      return new PrismaClient({ adapter });
    } catch (error) {
      console.error("❌ Turso adapter not installed. Run: pnpm add @libsql/client @prisma/adapter-libsql");
      throw error;
    }
  }

  // Local SQLite (development)
  console.log("✅ Using local SQLite database");
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
