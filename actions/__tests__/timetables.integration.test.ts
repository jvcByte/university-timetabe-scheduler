import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestDatabase,
} from "@/lib/__tests__/test-db";
import {
  createTestDepartment,
  createTestCourse,
  createTestInstructor,
  createTestRoom,
  createTestStudentGroup,
  createTestConstraintConfig,
  createTestTimetable,
  createTestAssignment,
} from "@/lib/__tests__/test-fixtures";
import {
  generateTimetable,
  getTimetableById,
  getTimetables,
  publishTimetable,
  archiveTimetable,
  updateAssignment,
} from "../timetables";
import * as solverClientModule from "@/lib/solver-client";
import type { TimetableResult } from "@/lib/solver-client";

// Mock the solver client
vi.mock("@/lib/solver-client", async () => {
  const actual = await vi.importActual("@/lib/solver-client");
  return {
    ...actual,
    solverClient: {
      generateTimetable: vi.fn(),
      validateTimetable: vi.fn(),
      healthCheck: vi.fn(),
    },
  };
});

describe("Timetable Server Actions Integration Tests", () => {
  let prisma: PrismaClient;
  let departmentId: number;
  let courseId: number;
  let instructorId: number;
  let roomId: number;
  let groupId: number;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase(prisma);
    vi.clearAllMocks();

    // Create test data
    const department = await createTestDepartment(prisma);
    departmentId = department.id;

    const course = await createTestCourse(prisma, departmentId);
    courseId = course.id;

    const instructor = await createTestInstructor(prisma, departmentId);
    instructorId = instructor.id;

    const room = await createTestRoom(prisma);
    roomId = room.id;

    const group = await createTestStudentGroup(prisma);
    groupId = group.id;

    // Link course to instructor and group
    await prisma.courseInstructor.create({
      data: {
        courseId,
        instructorId,
        isPrimary: true,
      },
    });

    await prisma.courseGroup.create({
      data: {
        courseId,
        groupId,
      },
    });

    // Create constraint config
    await createTestConstraintConfig(prisma);
  });

  describe("generateTimetable", () => {
    it("should generate timetable successfully with solver", async () => {
      const mockSolverResponse: TimetableResult = {
        success: true,
        assignments: [
          {
            course_id: courseId,
            instructor_id: instructorId,
            room_id: roomId,
            group_id: groupId,
            day: "MONDAY",
            start_time: "09:00",
            end_time: "10:00",
          },
        ],
        fitness_score: 0.95,
        violations: [],
        solve_time_seconds: 2.5,
        message: "Solution found",
      };

      vi.mocked(solverClientModule.solverClient.generateTimetable).mockResolvedValue(
        mockSolverResponse
      );

      const input = {
        name: "Fall 2025 Timetable",
        semester: "Fall",
        academicYear: "2025",
        timeLimitSeconds: 300,
      };

      const result = await generateTimetable(input);

      expect(result.success).toBe(true);
      expect(result.timetableId).toBeGreaterThan(0);
      expect(result.fitnessScore).toBe(0.95);
      expect(result.assignmentCount).toBe(1);

      // Verify timetable was created
      const timetable = await prisma.timetable.findUnique({
        where: { id: result.timetableId },
        include: { assignments: true },
      });

      expect(timetable).toBeDefined();
      expect(timetable?.status).toBe("GENERATED");
      expect(timetable?.assignments).toHaveLength(1);
    });

    it("should handle solver failure gracefully", async () => {
      const mockSolverResponse: TimetableResult = {
        success: false,
        assignments: [],
        fitness_score: null,
        violations: [
          {
            constraint_type: "room_conflict",
            severity: "hard",
            description: "Room double-booking detected",
            affected_assignments: [],
          },
        ],
        solve_time_seconds: 1.0,
        message: "No feasible solution found",
      };

      vi.mocked(solverClientModule.solverClient.generateTimetable).mockResolvedValue(
        mockSolverResponse
      );

      const input = {
        name: "Fall 2025 Timetable",
        semester: "Fall",
        academicYear: "2025",
      };

      const result = await generateTimetable(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.timetableId).toBeGreaterThan(0);

      // Verify timetable was created but marked as DRAFT
      const timetable = await prisma.timetable.findUnique({
        where: { id: result.timetableId },
      });

      expect(timetable?.status).toBe("DRAFT");
    });

    it("should handle solver API errors", async () => {
      vi.mocked(solverClientModule.solverClient.generateTimetable).mockRejectedValue(
        new Error("Connection failed")
      );

      const input = {
        name: "Fall 2025 Timetable",
        semester: "Fall",
        academicYear: "2025",
      };

      const result = await generateTimetable(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getTimetableById", () => {
    it("should retrieve timetable with assignments", async () => {
      const timetable = await createTestTimetable(prisma);
      await createTestAssignment(
        prisma,
        timetable.id,
        courseId,
        instructorId,
        roomId,
        groupId
      );

      const result = await getTimetableById(timetable.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(timetable.id);
      expect(result?.assignments).toHaveLength(1);
      expect(result?.assignments[0].course).toBeDefined();
      expect(result?.assignments[0].instructor).toBeDefined();
      expect(result?.assignments[0].room).toBeDefined();
      expect(result?.assignments[0].group).toBeDefined();
    });

    it("should return null for non-existent timetable", async () => {
      const result = await getTimetableById(99999);
      expect(result).toBeNull();
    });
  });

  describe("getTimetables", () => {
    it("should retrieve timetables with pagination", async () => {
      await createTestTimetable(prisma, { name: "Timetable 1" });
      await createTestTimetable(prisma, { name: "Timetable 2" });
      await createTestTimetable(prisma, { name: "Timetable 3" });

      const result = await getTimetables({ page: 1, pageSize: 2 });

      expect(result.timetables).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });

    it("should filter timetables by status", async () => {
      await createTestTimetable(prisma, { status: "DRAFT" });
      await createTestTimetable(prisma, { status: "PUBLISHED" });
      await createTestTimetable(prisma, { status: "PUBLISHED" });

      const result = await getTimetables({ status: "PUBLISHED" });

      expect(result.timetables).toHaveLength(2);
      expect(result.timetables.every((t) => t.status === "PUBLISHED")).toBe(true);
    });
  });

  describe("publishTimetable", () => {
    it("should publish a timetable successfully", async () => {
      const timetable = await createTestTimetable(prisma, { status: "GENERATED" });

      const result = await publishTimetable(timetable.id);

      expect(result.success).toBe(true);

      const updated = await prisma.timetable.findUnique({
        where: { id: timetable.id },
      });

      expect(updated?.status).toBe("PUBLISHED");
      expect(updated?.publishedAt).toBeDefined();
    });
  });

  describe("archiveTimetable", () => {
    it("should archive a timetable successfully", async () => {
      const timetable = await createTestTimetable(prisma, { status: "PUBLISHED" });

      const result = await archiveTimetable(timetable.id);

      expect(result.success).toBe(true);

      const updated = await prisma.timetable.findUnique({
        where: { id: timetable.id },
      });

      expect(updated?.status).toBe("ARCHIVED");
    });
  });

  describe("updateAssignment", () => {
    it("should update assignment time successfully", async () => {
      const timetable = await createTestTimetable(prisma);
      const assignment = await createTestAssignment(
        prisma,
        timetable.id,
        courseId,
        instructorId,
        roomId,
        groupId,
        { startTime: "09:00", endTime: "10:00" }
      );

      const result = await updateAssignment({
        assignmentId: assignment.id,
        startTime: "10:00",
        endTime: "11:00",
      });

      expect(result.success).toBe(true);

      const updated = await prisma.assignment.findUnique({
        where: { id: assignment.id },
      });

      expect(updated?.startTime).toBe("10:00");
      expect(updated?.endTime).toBe("11:00");
    });

    it("should detect room conflicts", async () => {
      const timetable = await createTestTimetable(prisma);
      
      // Create first assignment
      await createTestAssignment(
        prisma,
        timetable.id,
        courseId,
        instructorId,
        roomId,
        groupId,
        { day: "MONDAY", startTime: "10:00", endTime: "11:00" }
      );

      // Create second course and assignment
      const course2 = await createTestCourse(prisma, departmentId, { code: "CS102" });
      const instructor2 = await createTestInstructor(prisma, departmentId, {
        email: "instructor2@test.com",
      });
      const group2 = await createTestStudentGroup(prisma, { name: "CS-2025-B" });

      const assignment2 = await createTestAssignment(
        prisma,
        timetable.id,
        course2.id,
        instructor2.id,
        roomId,
        group2.id,
        { day: "MONDAY", startTime: "09:00", endTime: "10:00" }
      );

      // Try to move assignment2 to conflict with assignment1
      const result = await updateAssignment({
        assignmentId: assignment2.id,
        startTime: "10:00",
        endTime: "11:00",
      });

      expect(result.success).toBe(false);
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts?.some((c) => c.type === "room_conflict")).toBe(true);
    });

    it("should detect instructor conflicts", async () => {
      const timetable = await createTestTimetable(prisma);
      
      // Create first assignment
      await createTestAssignment(
        prisma,
        timetable.id,
        courseId,
        instructorId,
        roomId,
        groupId,
        { day: "MONDAY", startTime: "10:00", endTime: "11:00" }
      );

      // Create second course and assignment with same instructor
      const course2 = await createTestCourse(prisma, departmentId, { code: "CS102" });
      const room2 = await createTestRoom(prisma, { name: "Room 102" });
      const group2 = await createTestStudentGroup(prisma, { name: "CS-2025-B" });

      const assignment2 = await createTestAssignment(
        prisma,
        timetable.id,
        course2.id,
        instructorId,
        room2.id,
        group2.id,
        { day: "MONDAY", startTime: "09:00", endTime: "10:00" }
      );

      // Try to move assignment2 to conflict with assignment1
      const result = await updateAssignment({
        assignmentId: assignment2.id,
        startTime: "10:00",
        endTime: "11:00",
      });

      expect(result.success).toBe(false);
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts?.some((c) => c.type === "instructor_conflict")).toBe(true);
    });
  });
});
