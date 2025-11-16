import { PrismaClient } from "@prisma/client";

/**
 * Create test department
 */
export async function createTestDepartment(prisma: PrismaClient, data?: Partial<any>) {
  return prisma.department.create({
    data: {
      code: data?.code || "CS",
      name: data?.name || "Computer Science",
      description: data?.description || "Computer Science Department",
    },
  });
}

/**
 * Create test course
 */
export async function createTestCourse(
  prisma: PrismaClient,
  departmentId: number,
  data?: Partial<any>
) {
  return prisma.course.create({
    data: {
      code: data?.code || "CS101",
      title: data?.title || "Introduction to Programming",
      duration: data?.duration || 60,
      credits: data?.credits || 3,
      departmentId,
      roomType: data?.roomType || null,
    },
  });
}

/**
 * Create test instructor
 */
export async function createTestInstructor(
  prisma: PrismaClient,
  departmentId: number,
  data?: Partial<any>
) {
  return prisma.instructor.create({
    data: {
      name: data?.name || "Dr. John Doe",
      email: data?.email || "john.doe@test.com",
      departmentId,
      teachingLoad: data?.teachingLoad || 20,
      availability: data?.availability || {
        MONDAY: ["09:00-12:00", "14:00-17:00"],
        TUESDAY: ["09:00-12:00", "14:00-17:00"],
        WEDNESDAY: ["09:00-12:00", "14:00-17:00"],
        THURSDAY: ["09:00-12:00", "14:00-17:00"],
        FRIDAY: ["09:00-12:00", "14:00-17:00"],
      },
      preferences: data?.preferences || null,
      userId: data?.userId || null,
    },
  });
}

/**
 * Create test room
 */
export async function createTestRoom(prisma: PrismaClient, data?: Partial<any>) {
  return prisma.room.create({
    data: {
      name: data?.name || "Room 101",
      building: data?.building || "Main Building",
      capacity: data?.capacity || 30,
      type: data?.type || "LECTURE_HALL",
      equipment: data?.equipment || ["PROJECTOR", "WHITEBOARD"],
    },
  });
}

/**
 * Create test student group
 */
export async function createTestStudentGroup(prisma: PrismaClient, data?: Partial<any>) {
  return prisma.studentGroup.create({
    data: {
      name: data?.name || "CS-2024-A",
      program: data?.program || "Computer Science",
      year: data?.year || 1,
      semester: data?.semester || 1,
      size: data?.size || 25,
    },
  });
}

/**
 * Create test user
 */
export async function createTestUser(prisma: PrismaClient, data?: Partial<any>) {
  return prisma.user.create({
    data: {
      email: data?.email || "test@test.com",
      name: data?.name || "Test User",
      password: data?.password || "hashedpassword",
      role: data?.role || "ADMIN",
    },
  });
}

/**
 * Create test constraint config
 */
export async function createTestConstraintConfig(prisma: PrismaClient, data?: Partial<any>) {
  return prisma.constraintConfig.create({
    data: {
      name: data?.name || "Default",
      isDefault: data?.isDefault ?? true,
      noRoomDoubleBooking: data?.noRoomDoubleBooking ?? true,
      noInstructorDoubleBooking: data?.noInstructorDoubleBooking ?? true,
      roomCapacityCheck: data?.roomCapacityCheck ?? true,
      roomTypeMatch: data?.roomTypeMatch ?? true,
      workingHoursOnly: data?.workingHoursOnly ?? true,
      instructorPreferencesWeight: data?.instructorPreferencesWeight ?? 5,
      compactSchedulesWeight: data?.compactSchedulesWeight ?? 7,
      balancedDailyLoadWeight: data?.balancedDailyLoadWeight ?? 6,
      preferredRoomsWeight: data?.preferredRoomsWeight ?? 3,
      workingHoursStart: data?.workingHoursStart || "08:00",
      workingHoursEnd: data?.workingHoursEnd || "18:00",
    },
  });
}

/**
 * Create test timetable
 */
export async function createTestTimetable(prisma: PrismaClient, data?: Partial<any>) {
  return prisma.timetable.create({
    data: {
      name: data?.name || "Fall 2024 Timetable",
      semester: data?.semester || "Fall",
      academicYear: data?.academicYear || "2024",
      status: data?.status || "DRAFT",
      fitnessScore: data?.fitnessScore || null,
      violations: data?.violations || null,
    },
  });
}

/**
 * Create test assignment
 */
export async function createTestAssignment(
  prisma: PrismaClient,
  timetableId: number,
  courseId: number,
  instructorId: number,
  roomId: number,
  groupId: number,
  data?: Partial<any>
) {
  return prisma.assignment.create({
    data: {
      day: data?.day || "MONDAY",
      startTime: data?.startTime || "09:00",
      endTime: data?.endTime || "10:00",
      timetableId,
      courseId,
      instructorId,
      roomId,
      groupId,
    },
  });
}
