import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { randomBytes } from "crypto";

let testPrisma: PrismaClient | null = null;
let testDbUrl: string | null = null;

/**
 * Setup test database with a unique name
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  // Generate unique database name for this test run
  const dbName = `test_${randomBytes(8).toString("hex")}.db`;
  testDbUrl = `file:./${dbName}`;

  // Set environment variable for Prisma
  process.env.DATABASE_URL = testDbUrl;

  // Create new Prisma client
  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl,
      },
    },
  });

  // Run migrations to create schema
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "ignore",
    });
  } catch (error) {
    // If migrate deploy fails, try db push
    execSync("npx prisma db push --skip-generate", {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "ignore",
    });
  }

  return testPrisma;
}

/**
 * Cleanup test database
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }

  // Clean up database file
  if (testDbUrl) {
    const dbPath = testDbUrl.replace("file:", "");
    try {
      const fs = require("fs");
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
      // Also remove journal files
      if (fs.existsSync(`${dbPath}-journal`)) {
        fs.unlinkSync(`${dbPath}-journal`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    testDbUrl = null;
  }
}

/**
 * Clear all data from test database
 */
export async function clearTestDatabase(prisma: PrismaClient): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.assignment.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.courseGroup.deleteMany();
  await prisma.courseInstructor.deleteMany();
  await prisma.course.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.room.deleteMany();
  await prisma.studentGroup.deleteMany();
  await prisma.student.deleteMany();
  await prisma.constraintConfig.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Get test Prisma client
 */
export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    throw new Error("Test database not initialized. Call setupTestDatabase first.");
  }
  return testPrisma;
}
