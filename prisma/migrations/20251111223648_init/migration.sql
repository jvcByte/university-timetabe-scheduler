-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "roomType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "teachingLoad" INTEGER NOT NULL,
    "availability" JSONB NOT NULL,
    "preferences" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Room" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "equipment" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "StudentGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseInstructor" (
    "courseId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("courseId", "instructorId"),
    CONSTRAINT "CourseInstructor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseGroup" (
    "courseId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    PRIMARY KEY ("courseId", "groupId"),
    CONSTRAINT "CourseGroup_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fitnessScore" REAL,
    "violations" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "timetableId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConstraintConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "noRoomDoubleBooking" BOOLEAN NOT NULL DEFAULT true,
    "noInstructorDoubleBooking" BOOLEAN NOT NULL DEFAULT true,
    "roomCapacityCheck" BOOLEAN NOT NULL DEFAULT true,
    "roomTypeMatch" BOOLEAN NOT NULL DEFAULT true,
    "workingHoursOnly" BOOLEAN NOT NULL DEFAULT true,
    "instructorPreferencesWeight" INTEGER NOT NULL DEFAULT 5,
    "compactSchedulesWeight" INTEGER NOT NULL DEFAULT 7,
    "balancedDailyLoadWeight" INTEGER NOT NULL DEFAULT 6,
    "preferredRoomsWeight" INTEGER NOT NULL DEFAULT 3,
    "workingHoursStart" TEXT NOT NULL DEFAULT '08:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGroup_name_key" ON "StudentGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGroup_userId_key" ON "StudentGroup"("userId");

-- CreateIndex
CREATE INDEX "Assignment_timetableId_idx" ON "Assignment"("timetableId");

-- CreateIndex
CREATE INDEX "Assignment_courseId_idx" ON "Assignment"("courseId");

-- CreateIndex
CREATE INDEX "Assignment_instructorId_idx" ON "Assignment"("instructorId");

-- CreateIndex
CREATE INDEX "Assignment_roomId_idx" ON "Assignment"("roomId");

-- CreateIndex
CREATE INDEX "Assignment_groupId_idx" ON "Assignment"("groupId");

-- CreateIndex
CREATE INDEX "Assignment_day_startTime_idx" ON "Assignment"("day", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_timetableId_day_startTime_roomId_key" ON "Assignment"("timetableId", "day", "startTime", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_timetableId_day_startTime_instructorId_key" ON "Assignment"("timetableId", "day", "startTime", "instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_timetableId_day_startTime_groupId_key" ON "Assignment"("timetableId", "day", "startTime", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstraintConfig_name_key" ON "ConstraintConfig"("name");
