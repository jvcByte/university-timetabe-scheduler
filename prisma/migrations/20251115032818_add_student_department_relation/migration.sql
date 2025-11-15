-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "program" TEXT,
    "year" INTEGER,
    "semester" INTEGER,
    "departmentId" INTEGER,
    "studentGroupId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_studentGroupId_fkey" FOREIGN KEY ("studentGroupId") REFERENCES "StudentGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("createdAt", "email", "id", "name", "program", "semester", "studentGroupId", "studentId", "updatedAt", "userId", "year") SELECT "createdAt", "email", "id", "name", "program", "semester", "studentGroupId", "studentId", "updatedAt", "userId", "year" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");
CREATE INDEX "Student_departmentId_idx" ON "Student"("departmentId");
CREATE INDEX "Student_studentGroupId_idx" ON "Student"("studentGroupId");
CREATE INDEX "Student_program_year_semester_idx" ON "Student"("program", "year", "semester");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
