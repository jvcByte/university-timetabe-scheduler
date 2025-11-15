/*
  Warnings:

  - You are about to drop the column `userId` on the `StudentGroup` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "program" TEXT,
    "year" INTEGER,
    "semester" INTEGER,
    "studentGroupId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Student_studentGroupId_fkey" FOREIGN KEY ("studentGroupId") REFERENCES "StudentGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StudentGroup" ("createdAt", "id", "name", "program", "semester", "size", "updatedAt", "year") SELECT "createdAt", "id", "name", "program", "semester", "size", "updatedAt", "year" FROM "StudentGroup";
DROP TABLE "StudentGroup";
ALTER TABLE "new_StudentGroup" RENAME TO "StudentGroup";
CREATE UNIQUE INDEX "StudentGroup_name_key" ON "StudentGroup"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_studentGroupId_idx" ON "Student"("studentGroupId");

-- CreateIndex
CREATE INDEX "Student_program_year_semester_idx" ON "Student"("program", "year", "semester");
