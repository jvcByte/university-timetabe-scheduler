"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { TimetableSolver } from "@/lib/local-solver";
import type {
  CourseInput,
  InstructorInput,
  RoomInput,
  StudentGroupInput,
  ConstraintConfigInput,
  Day,
} from "@/lib/solver-client";
import { getDefaultConstraintConfig } from "@/lib/constraints";
import {
  logError,
  logInfo,
  assertExists,
  AppError,
  ErrorCode,
} from "@/lib/error-handling";

export interface GenerateTimetableInput {
  name: string;
  semester: string;
  academicYear: string;
  constraintConfigId?: number;
  timeLimitSeconds?: number;
}

export interface GenerateTimetableResult {
  success: boolean;
  timetableId?: number;
  fitnessScore?: number;
  assignmentCount?: number;
  violationCount?: number;
  solveTimeSeconds?: number;
  error?: string;
  details?: string;
}

/**
 * Generate a new timetable using the local TypeScript solver
 * Much faster and supports concurrent requests
 */
export async function generateTimetableLocal(
  input: GenerateTimetableInput
): Promise<GenerateTimetableResult> {
  const startTime = Date.now();

  try {
    // 1. Create timetable record with GENERATING status
    const timetable = await prisma.timetable.create({
      data: {
        name: input.name,
        semester: input.semester,
        academicYear: input.academicYear,
        status: "GENERATING",
      },
    });

    try {
      // 2. Fetch all required data from database
      const [courses, instructors, rooms, groups, constraintConfig] =
        await Promise.all([
          prisma.course.findMany({
            include: {
              instructors: {
                include: {
                  instructor: true,
                },
              },
              groups: {
                include: {
                  group: true,
                },
              },
              department: true,
            },
          }),
          prisma.instructor.findMany({
            include: {
              department: true,
            },
          }),
          prisma.room.findMany(),
          prisma.studentGroup.findMany({
            include: {
              courses: {
                include: {
                  course: true,
                },
              },
            },
          }),
          input.constraintConfigId
            ? prisma.constraintConfig.findUnique({
                where: { id: input.constraintConfigId },
              })
            : getDefaultConstraintConfig(),
        ]);

      assertExists(constraintConfig, "Constraint configuration");

      // Validate that we have sufficient data
      if (courses.length === 0) {
        throw new AppError(
          "No courses found. Please add courses before generating a timetable.",
          ErrorCode.INVALID_STATE,
          400
        );
      }
      if (instructors.length === 0) {
        throw new AppError(
          "No instructors found. Please add instructors before generating a timetable.",
          ErrorCode.INVALID_STATE,
          400
        );
      }
      if (rooms.length === 0) {
        throw new AppError(
          "No rooms found. Please add rooms before generating a timetable.",
          ErrorCode.INVALID_STATE,
          400
        );
      }
      if (groups.length === 0) {
        throw new AppError(
          "No student groups found. Please add student groups before generating a timetable.",
          ErrorCode.INVALID_STATE,
          400
        );
      }

      logInfo("generateTimetableLocal", "Loaded data for timetable generation", {
        courseCount: courses.length,
        instructorCount: instructors.length,
        roomCount: rooms.length,
        groupCount: groups.length,
      });

      // 3. Format data for solver
      const courseInputs: CourseInput[] = courses.map((course) => {
        const instructorIds = course.instructors.map((ci) => ci.instructor.id);
        const groupIds = course.groups.map((cg) => cg.group.id);

        return {
          id: course.id,
          code: course.code,
          title: course.title,
          duration: course.duration,
          department: course.department.name,
          room_type: course.roomType,
          instructor_ids: instructorIds,
          group_ids: groupIds,
        };
      });

      const instructorInputs: InstructorInput[] = instructors.map((instructor) => {
        const availability = instructor.availability as Record<Day, string[]>;

        return {
          id: instructor.id,
          name: instructor.name,
          department: instructor.department.name,
          teaching_load: instructor.teachingLoad,
          availability,
          preferences: instructor.preferences as Record<string, any> | null,
        };
      });

      const roomInputs: RoomInput[] = rooms.map((room) => {
        return {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          type: room.type,
          equipment: room.equipment as string[] | null,
        };
      });

      const groupInputs: StudentGroupInput[] = groups.map((group) => {
        const courseIds = group.courses.map((cg) => cg.course.id);

        return {
          id: group.id,
          name: group.name,
          size: group.size,
          course_ids: courseIds,
        };
      });

      const constraintInputs: ConstraintConfigInput = {
        hard: {
          noRoomDoubleBooking: constraintConfig.noRoomDoubleBooking,
          noInstructorDoubleBooking: constraintConfig.noInstructorDoubleBooking,
          roomCapacityCheck: constraintConfig.roomCapacityCheck,
          roomTypeMatch: constraintConfig.roomTypeMatch,
          workingHoursOnly: constraintConfig.workingHoursOnly,
        },
        soft: {
          instructorPreferences: constraintConfig.instructorPreferencesWeight,
          compactSchedules: constraintConfig.compactSchedulesWeight,
          balancedDailyLoad: constraintConfig.balancedDailyLoadWeight,
          preferredRooms: constraintConfig.preferredRoomsWeight,
        },
        working_hours_start: constraintConfig.workingHoursStart,
        working_hours_end: constraintConfig.workingHoursEnd,
      };

      // 4. Run local solver
      logInfo("generateTimetableLocal", "Starting local solver");
      const solver = new TimetableSolver(
        courseInputs,
        instructorInputs,
        roomInputs,
        groupInputs,
        constraintInputs
      );

      const result = await solver.solve(input.timeLimitSeconds || 300);
      
      const solveTimeSeconds = (Date.now() - startTime) / 1000;
      logInfo("generateTimetableLocal", "Solver completed", {
        solveTimeSeconds: solveTimeSeconds.toFixed(2),
        assignmentCount: result.assignments.length,
        fitness: result.fitness.toFixed(2),
        violationCount: result.violations.length,
      });

      // 5. Store assignments in database
      if (result.assignments.length > 0) {
        const assignments = result.assignments.map((assignment) => ({
          day: assignment.day,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          courseId: assignment.courseId,
          instructorId: assignment.instructorId,
          roomId: assignment.roomId,
          groupId: assignment.groupId,
          timetableId: timetable.id,
        }));

        await prisma.assignment.createMany({
          data: assignments,
        });
      }

      // 6. Format violations for storage
      const violations = result.violations.map(v => ({
        constraint_type: v.type,
        severity: v.severity,
        description: v.description,
        affected_assignments: v.assignmentIndices,
      }));

      // 7. Update timetable with results
      await prisma.timetable.update({
        where: { id: timetable.id },
        data: {
          status: "GENERATED",
          fitnessScore: result.fitness,
          violations: violations as any,
        },
      });

      // 8. Revalidate relevant pages
      revalidatePath("/admin/timetables");
      revalidatePath(`/admin/timetables/${timetable.id}`);

      logInfo("generateTimetableLocal", "Timetable generated successfully", {
        timetableId: timetable.id,
        assignmentCount: result.assignments.length,
        fitnessScore: result.fitness,
      });

      return {
        success: true,
        timetableId: timetable.id,
        fitnessScore: result.fitness,
        assignmentCount: result.assignments.length,
        violationCount: result.violations.filter(v => v.severity === 'HARD').length,
        solveTimeSeconds,
      };
    } catch (error: any) {
      // Update timetable status to DRAFT on error
      try {
        await prisma.timetable.update({
          where: { id: timetable.id },
          data: {
            status: "DRAFT",
          },
        });
      } catch (updateError) {
        logError("generateTimetableLocal", updateError, {
          context: "Failed to update timetable status to DRAFT",
          timetableId: timetable.id,
        });
      }

      throw error;
    }
  } catch (error: any) {
    logError("generateTimetableLocal", error, { input });

    // Provide user-friendly error messages based on error type
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
        details: error.details?.message,
      };
    }

    // Handle specific error patterns
    let errorMessage = "Failed to generate timetable";
    let errorDetails = error.message;

    if (error.message?.includes("Constraint configuration not found")) {
      errorMessage = "Configuration Error";
      errorDetails = "Constraint configuration not found. Please ensure a default configuration exists.";
    } else if (error.message?.includes("No courses found")) {
      errorMessage = "Missing Data";
      errorDetails = error.message;
    } else if (error.message?.includes("No instructors found")) {
      errorMessage = "Missing Data";
      errorDetails = error.message;
    } else if (error.message?.includes("No rooms found")) {
      errorMessage = "Missing Data";
      errorDetails = error.message;
    } else if (error.message?.includes("No student groups found")) {
      errorMessage = "Missing Data";
      errorDetails = error.message;
    } else if (error.name === "PrismaClientKnownRequestError") {
      errorMessage = "Database Error";
      errorDetails = "Failed to access database. Please try again later.";
    } else if (error.message) {
      errorDetails = error.message;
    } else {
      errorDetails = "An unexpected error occurred. Please try again.";
    }

    return {
      success: false,
      error: errorMessage,
      details: errorDetails,
    };
  }
}
