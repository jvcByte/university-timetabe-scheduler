/*
  Warnings:

  - You are about to drop the column `department` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Instructor` table. All the data in the column will be lost.
  - Added the required column `departmentId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `Instructor` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- Insert departments from existing data
INSERT INTO "Department" ("code", "name", "description", "createdAt", "updatedAt")
SELECT DISTINCT 
    CASE 
        WHEN department = 'Computer Science' THEN 'CS'
        WHEN department = 'Mathematics' THEN 'MATH'
        ELSE UPPER(SUBSTR(department, 1, 4))
    END as code,
    department as name,
    NULL as description,
    CURRENT_TIMESTAMP as createdAt,
    CURRENT_TIMESTAMP as updatedAt
FROM (
    SELECT DISTINCT department FROM "Course"
    UNION
    SELECT DISTINCT department FROM "Instructor"
) WHERE department IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Migrate Course table
CREATE TABLE "new_Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "roomType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Course" ("id", "code", "title", "duration", "credits", "departmentId", "roomType", "createdAt", "updatedAt")
SELECT 
    c."id", 
    c."code", 
    c."title", 
    c."duration", 
    c."credits", 
    d."id" as departmentId,
    c."roomType", 
    c."createdAt", 
    c."updatedAt"
FROM "Course" c
LEFT JOIN "Department" d ON c."department" = d."name";

DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE INDEX "Course_departmentId_idx" ON "Course"("departmentId");

-- Migrate Instructor table
CREATE TABLE "new_Instructor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "teachingLoad" INTEGER NOT NULL,
    "availability" JSONB NOT NULL,
    "preferences" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Instructor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Instructor" ("id", "userId", "name", "email", "departmentId", "teachingLoad", "availability", "preferences", "createdAt", "updatedAt")
SELECT 
    i."id", 
    i."userId", 
    i."name", 
    i."email", 
    d."id" as departmentId,
    i."teachingLoad", 
    i."availability", 
    i."preferences", 
    i."createdAt", 
    i."updatedAt"
FROM "Instructor" i
LEFT JOIN "Department" d ON i."department" = d."name";

DROP TABLE "Instructor";
ALTER TABLE "new_Instructor" RENAME TO "Instructor";
CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");
CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");
CREATE INDEX "Instructor_departmentId_idx" ON "Instructor"("departmentId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
