import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestDatabase,
} from "@/lib/__tests__/test-db";
import { createTestDepartment } from "@/lib/__tests__/test-fixtures";
import { createCourse, updateCourse, deleteCourse } from "../courses";

describe("Course Server Actions Integration Tests", () => {
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

  describe("createCourse", () => {
    it("should create a course successfully", async () => {
      const input = {
        code: "CS101",
        title: "Introduction to Programming",
        duration: 60,
        credits: 3,
        departmentId,
        roomType: "LECTURE_HALL",
        instructorIds: [],
        groupIds: [],
      };

      const result = await createCourse(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeGreaterThan(0);

      const course = await prisma.course.findUnique({
        where: { id: result.data!.id },
      });

      expect(course).toBeDefined();
      expect(course?.code).toBe("CS101");
      expect(course?.title).toBe("Introduction to Programming");
    });

    it("should fail when course code already exists", async () => {
      await prisma.course.create({
        data: {
          code: "CS101",
          title: "Existing Course",
          duration: 60,
          credits: 3,
          departmentId,
        },
      });

      const input = {
        code: "CS101",
        title: "New Course",
        duration: 60,
        credits: 3,
        departmentId,
        instructorIds: [],
        groupIds: [],
      };

      const result = await createCourse(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("should create course with instructors and groups", async () => {
      const instructor = await prisma.instructor.create({
        data: {
          name: "Dr. Smith",
          email: "smith@test.com",
          departmentId,
          teachingLoad: 20,
          availability: { MONDAY: ["09:00-12:00"] },
        },
      });

      const group = await prisma.studentGroup.create({
        data: {
          name: "CS-2024-A",
          program: "Computer Science",
          year: 1,
          semester: 1,
          size: 25,
        },
      });

      const input = {
        code: "CS101",
        title: "Introduction to Programming",
        duration: 60,
        credits: 3,
        departmentId,
        instructorIds: [instructor.id],
        groupIds: [group.id],
      };

      const result = await createCourse(input);

      expect(result.success).toBe(true);

      const course = await prisma.course.findUnique({
        where: { id: result.data!.id },
        include: {
          instructors: true,
          groups: true,
        },
      });

      expect(course?.instructors).toHaveLength(1);
      expect(course?.groups).toHaveLength(1);
    });
  });

  describe("updateCourse", () => {
    it("should update a course successfully", async () => {
      const course = await prisma.course.create({
        data: {
          code: "CS101",
          title: "Old Title",
          duration: 60,
          credits: 3,
          departmentId,
        },
      });

      const input = {
        id: course.id,
        code: "CS101",
        title: "New Title",
        duration: 90,
        credits: 4,
        departmentId,
        instructorIds: [],
        groupIds: [],
      };

      const result = await updateCourse(input);

      expect(result.success).toBe(true);

      const updated = await prisma.course.findUnique({
        where: { id: course.id },
      });

      expect(updated?.title).toBe("New Title");
      expect(updated?.duration).toBe(90);
      expect(updated?.credits).toBe(4);
    });

    it("should fail when updating to existing course code", async () => {
      await prisma.course.create({
        data: {
          code: "CS101",
          title: "Course 1",
          duration: 60,
          credits: 3,
          departmentId,
        },
      });

      const course2 = await prisma.course.create({
        data: {
          code: "CS102",
          title: "Course 2",
          duration: 60,
          credits: 3,
          departmentId,
        },
      });

      const input = {
        id: course2.id,
        code: "CS101",
        title: "Course 2",
        duration: 60,
        credits: 3,
        departmentId,
        instructorIds: [],
        groupIds: [],
      };

      const result = await updateCourse(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });
  });

  describe("deleteCourse", () => {
    it("should delete a course successfully", async () => {
      const course = await prisma.course.create({
        data: {
          code: "CS101",
          title: "Test Course",
          duration: 60,
          credits: 3,
          departmentId,
        },
      });

      const result = await deleteCourse(course.id);

      expect(result.success).toBe(true);

      const deleted = await prisma.course.findUnique({
        where: { id: course.id },
      });

      expect(deleted).toBeNull();
    });

    it("should fail when course has assignments", async () => {
      const course = await prisma.course.create({
        data: {
          code: "CS101",
          title: "Test Course",
          duration: 60,
          credits: 3,
          departmentId,
        },
      });

      const instructor = await prisma.instructor.create({
        data: {
          name: "Dr. Smith",
          email: "smith@test.com",
          departmentId,
          teachingLoad: 20,
          availability: { MONDAY: ["09:00-12:00"] },
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

      const result = await deleteCourse(course.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain("assignment");
    });
  });
});
