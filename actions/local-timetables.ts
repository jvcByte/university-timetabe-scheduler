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

      if (!constraintConfig) {
        throw new Error("Constraint configuration not found");
      }

      console.log(`Loaded ${courses.length} courses, ${instructors.length} instructors, ${rooms.length} rooms, ${groups.length} groups`);

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
      console.log('Starting local solver...');
      const solver = new TimetableSolver(
        courseInputs,
        instructorInputs,
        roomInputs,
        groupInputs,
        constraintInputs
      );

      const result = await solver.solve(input.timeLimitSeconds || 300);
      
      const solveTimeSeconds = (Date.now() - startTime) / 1000;
      console.log(`Solver completed in ${solveTimeSeconds.toFixed(2)}s`);
      console.log(`Generated ${result.assignments.length} assignments with fitness ${result.fitness.toFixed(2)}`);
      console.log(`Found ${result.violations.length} violations`);

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
      await prisma.timetable.update({
        where: { id: timetable.id },
        data: {
          status: "DRAFT",
        },
      });

      throw error;
    }
  } catch (error: any) {
    console.error("Failed to generate timetable:", error);

    return {
      success: false,
      error: "Failed to generate timetable",
      details: error.message,
    };
  }
}
