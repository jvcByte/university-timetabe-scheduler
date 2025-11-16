import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestDatabase,
} from "@/lib/__tests__/test-db";
import { createTestDepartment } from "@/lib/__tests__/test-fixtures";
import {
  createInstructor,
  updateInstructor,
  deleteInstructor,
  updateInstructorAvailability,
} from "../instructors";

describe("Instructor Server Actions Integration Tests", () => {
  let prisma: PrismaClient;
  let departmentId: number;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase(prisma);
    const department = await createTestDepartment(prisma);
    departmentId = department.id;
  });

  describe("createInstructor", () => {
    it("should create an instructor successfully", async () => {
      const input = {
        name: "Dr. John Doe",
        email: "john.doe@test.com",
        departmentId,
        teachingLoad: 20,
        availability: {
          MONDAY: ["09:00-12:00", "14:00-17:00"],
          TUESDAY: ["09:00-12:00"],
          WEDNESDAY: ["09:00-12:00", "14:00-17:00"],
          THURSDAY: ["09:00-12:00"],
          FRIDAY: ["09:00-12:00"],
        },
        preferences: null,
        userId: null,
      };

      const result = await createInstructor(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeGreaterThan(0);

      const instructor = await prisma.instructor.findUnique({
        where: { id: result.data!.id },
      });

      expect(instructor).toBeDefined();
      expect(instructor?.name).toBe("Dr. John Doe");
      expect(instructor?.email).toBe("john.doe@test.com");
    });

    it("should fail when email already exists", async () => {
      await prisma.instructor.create({
        data: {
          name: "Existing Instructor",
          email: "john.doe@test.com",
          departmentId,
          teachingLoad: 20,
          availability: { MONDAY: ["09:00-12:00"] },
        },
      });

      const input = {
        name: "Dr. John Doe",
        email: "john.doe@test.com",
        departmentId,
        teachingLoad: 20,
        availability: { MONDAY: ["09:00-12:00"] },
        preferences: null,
        userId: null,
      };

      const result = await createInstructor(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });
  });

  describe("updateInstructor", () => {
    it("should update an instructor successfully", async () => {
      const instructor = await prisma.instructor.create({
        data: {
          name: "Dr. John Doe",
          email: "john.doe@test.com",
          departmentId,
          teachingLoad: 20,
          availability: { MONDAY: ["09:00-12:00"] },
        },
      });

      const input = {
        id: instructor.id,
        name: "Dr. Jane Doe",
        email: "john.doe@test.com",
        departmentId,
        teachingLoad: 25,
        availability: {
          MONDAY: ["09:00-12:00", "14:00-17:00"],
          TUESDAY: ["09:00-12:00"],
        },
        preferences: null,
        userId: null,
      };

      const result = await updateInstructor(input);

      expect(result.success).toBe(true);

      const updated = await prisma.instructor.findUnique({
        where: { id: instructor.id },
      });

      expect(updated?.name).toBe("Dr. Jane Doe");
      expect(updated?.teachingLoad).toBe(25);
    });
  });

  describe("deleteInstructor", () => {
    it("should delete an instructor successfully", async () => {
      const instructor = await prisma.instructor.create({
        data: {
          name: "Dr. John Doe",
          email: "john.doe@test.com",
          departmentId,
          teachingLoad: 20,
          availability: { MONDAY: ["09:00-12:00"] },
        },
      });

      const result = await deleteInstructor(instructor.id);

      expect(result.success).toBe(true);

      const deleted = await prisma.instructor.findUnique({
        where: { id: instructor.id },
      });

      expect(deleted).toBeNull();
    });

    it("should fail when instructor has assignments", async () => {
      const instructor = await prisma.instructor.create({
        data: {
          name: "Dr. John Doe",
          email: "john.doe@test.com",
          departmentId,
          teachingLoad: 20,
          availability: { MONDAY: ["09:00-12:00"] },
        },
      });

      const course = await prisma.course.create({
        data: {
          code: "CS101",
          title: "Test Course",
          duration: 60,
          credits: 3,
          departmentId,
        },
      });

      const room = await prisma.room.create({
        data: {
          name: "Room 101",
          building: "Main",
          capacity: 30,
          type: "LECTURE_HALL",
        },
      });

      const group = await prisma.studentGroup.create({
        data: {
          name: "CS-2024-A",
          program: "CS",
          year: 1,
          semester: 1,
          size: 25,
        },
      });

      const timetable = await prisma.timetable.create({
        data: {
          name: "Test Timetable",
          semester: "Fall",
          academicYear: "2024",
          status: "DRAFT",
        },
      });

      await prisma.assignment.create({
        data: {
          day: "MONDAY",
          startTime: "09:00",
          endTime: "10:00",
          courseId: course.id,
          instructorId: instructor.id,
          roomId: room.id,
          groupId: group.id,
          timetableId: timetable.id,
        },
      });

      const result = await deleteInstructor(instructor.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain("assignment");
    });
  });

  describe("updateInstructorAvailability", () => {
    it("should update instructor availability successfully", async () => {
      const instructor = await prisma.instructor.create({
        data: {
          name: "Dr. John Doe",
          email: "john.doe@test.com",
          departmentId,
          teachingLoad: 20,
          availability: { MONDAY: ["09:00-12:00"] },
        },
      });

      const newAvailability = {
        MONDAY: ["09:00-12:00", "14:00-17:00"],
        TUESDAY: ["09:00-12:00"],
        WEDNESDAY: ["14:00-17:00"],
      };

      const preferences = {
        preferredDays: ["MONDAY", "WEDNESDAY"],
        preferredTimes: ["09:00-12:00"],
      };

      const result = await updateInstructorAvailability(
        instructor.id,
        newAvailability,
        preferences
      );

      expect(result.success).toBe(true);

      const updated = await prisma.instructor.findUnique({
        where: { id: instructor.id },
      });

      expect(updated?.availability).toEqual(newAvailability);
      expect(updated?.preferences).toEqual(preferences);
    });
  });
});
