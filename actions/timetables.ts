"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { solverClient, type Day } from "@/lib/solver-client";
import type {
  GenerationPayload,
  CourseInput,
  InstructorInput,
  RoomInput,
  StudentGroupInput,
  ConstraintConfigInput,
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
 * Generate a new timetable using the solver service
 */
export async function generateTimetable(
  input: GenerateTimetableInput
): Promise<GenerateTimetableResult> {
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
          // Fetch courses with their instructors and groups
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
          // Fetch all instructors
          prisma.instructor.findMany({
            include: {
              department: true,
            },
          }),
          // Fetch all rooms
          prisma.room.findMany(),
          // Fetch all student groups with their courses
          prisma.studentGroup.findMany({
            include: {
              courses: {
                include: {
                  course: true,
                },
              },
            },
          }),
          // Fetch constraint configuration
          input.constraintConfigId
            ? prisma.constraintConfig.findUnique({
                where: { id: input.constraintConfigId },
              })
            : getDefaultConstraintConfig(),
        ]);

      if (!constraintConfig) {
        throw new Error("Constraint configuration not found");
      }

      // 3. Format data for solver service
      const payload: GenerationPayload = {
        courses: courses.map((course): CourseInput => {
          const instructorIds = course.instructors.map(
            (ci) => ci.instructor.id
          );
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
        }),

        instructors: instructors.map((instructor): InstructorInput => {
          // Parse availability JSON
          const availability = instructor.availability as Record<Day, string[]>;

          return {
            id: instructor.id,
            name: instructor.name,
            department: instructor.department.name,
            teaching_load: instructor.teachingLoad,
            availability,
            preferences: instructor.preferences as Record<string, any> | null,
          };
        }),

        rooms: rooms.map((room): RoomInput => {
          return {
            id: room.id,
            name: room.name,
            capacity: room.capacity,
            type: room.type,
            equipment: room.equipment as string[] | null,
          };
        }),

        groups: groups.map((group): StudentGroupInput => {
          const courseIds = group.courses.map((cg) => cg.course.id);

          return {
            id: group.id,
            name: group.name,
            size: group.size,
            course_ids: courseIds,
          };
        }),

        constraints: {
          hard: {
            noRoomDoubleBooking: constraintConfig.noRoomDoubleBooking,
            noInstructorDoubleBooking:
              constraintConfig.noInstructorDoubleBooking,
            roomCapacityCheck: constraintConfig.roomCapacityCheck,
            roomTypeMatch: constraintConfig.roomTypeMatch,
            workingHoursOnly: constraintConfig.workingHoursOnly,
          },
          soft: {
            instructorPreferences:
              constraintConfig.instructorPreferencesWeight,
            compactSchedules: constraintConfig.compactSchedulesWeight,
            balancedDailyLoad: constraintConfig.balancedDailyLoadWeight,
            preferredRooms: constraintConfig.preferredRoomsWeight,
          },
          working_hours_start: constraintConfig.workingHoursStart,
          working_hours_end: constraintConfig.workingHoursEnd,
        } as ConstraintConfigInput,

        time_limit_seconds: input.timeLimitSeconds || 300,
      };

      // 4. Call solver API
      const result = await solverClient.generateTimetable(payload);

      // 5. Handle solver response
      if (!result.success) {
        // Update timetable status to DRAFT with error info
        await prisma.timetable.update({
          where: { id: timetable.id },
          data: {
            status: "DRAFT",
            violations: result.violations as any,
          },
        });

        return {
          success: false,
          timetableId: timetable.id,
          error: result.message,
          details:
            result.violations.length > 0
              ? `Found ${result.violations.length} constraint violations`
              : undefined,
        };
      }

      // 6. Store assignments in database
      const assignments = result.assignments.map((assignment) => ({
        day: assignment.day,
        startTime: assignment.start_time,
        endTime: assignment.end_time,
        courseId: assignment.course_id,
        instructorId: assignment.instructor_id,
        roomId: assignment.room_id,
        groupId: assignment.group_id,
        timetableId: timetable.id,
      }));

      await prisma.assignment.createMany({
        data: assignments,
      });

      // 7. Update timetable with results
      await prisma.timetable.update({
        where: { id: timetable.id },
        data: {
          status: "GENERATED",
          fitnessScore: result.fitness_score,
          violations: result.violations as any,
        },
      });

      // 8. Revalidate relevant pages
      revalidatePath("/admin/timetables");
      revalidatePath(`/admin/timetables/${timetable.id}`);

      return {
        success: true,
        timetableId: timetable.id,
        fitnessScore: result.fitness_score || undefined,
        assignmentCount: result.assignments.length,
        violationCount: result.violations.length,
        solveTimeSeconds: result.solve_time_seconds,
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

    // Provide user-friendly error messages
    let errorMessage = "Failed to generate timetable";
    let details: string | undefined;

    if (error.name === "SolverTimeoutError") {
      errorMessage = "Timetable generation timed out";
      details =
        "The solver took too long to find a solution. Try reducing the problem size or increasing the time limit.";
    } else if (error.name === "SolverConnectionError") {
      errorMessage = "Cannot connect to solver service";
      details =
        "The solver service is unavailable. Please check that it is running and try again.";
    } else if (error.name === "SolverAPIError") {
      errorMessage = "Solver service error";
      details = error.message;
    } else if (error.message) {
      details = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      details,
    };
  }
}

/**
 * Get a timetable by ID with all assignments
 */
export async function getTimetableById(id: number) {
  return prisma.timetable.findUnique({
    where: { id },
    include: {
      assignments: {
        include: {
          course: true,
          instructor: true,
          room: true,
          group: true,
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      },
    },
  });
}

/**
 * Get a timetable by ID with filtered assignments
 */
export async function getTimetableByIdWithFilters(
  id: number,
  filters?: {
    roomId?: number;
    instructorId?: number;
    groupId?: number;
  }
) {
  const where: any = { timetableId: id };

  if (filters?.roomId) {
    where.roomId = filters.roomId;
  }
  if (filters?.instructorId) {
    where.instructorId = filters.instructorId;
  }
  if (filters?.groupId) {
    where.groupId = filters.groupId;
  }

  const [timetable, assignments] = await Promise.all([
    prisma.timetable.findUnique({
      where: { id },
    }),
    prisma.assignment.findMany({
      where,
      include: {
        course: true,
        instructor: true,
        room: true,
        group: true,
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),
  ]);

  if (!timetable) {
    return null;
  }

  return {
    ...timetable,
    assignments,
  };
}

/**
 * Get all timetables with pagination and filtering
 */
export async function getTimetables(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  semester?: string;
}) {
  const { page = 1, pageSize = 10, status, semester } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (status) {
    where.status = status as any;
  }
  if (semester) {
    where.semester = semester;
  }

  const [timetables, total] = await Promise.all([
    prisma.timetable.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    }),
    prisma.timetable.count({ where }),
  ]);

  return {
    timetables,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get all unique semesters from timetables
 */
export async function getTimetableSemesters() {
  const timetables = await prisma.timetable.findMany({
    select: {
      semester: true,
      academicYear: true,
    },
    distinct: ["semester", "academicYear"],
    orderBy: [{ academicYear: "desc" }, { semester: "desc" }],
  });

  return timetables.map((t) => ({
    semester: t.semester,
    academicYear: t.academicYear,
    label: `${t.semester} ${t.academicYear}`,
  }));
}

/**
 * Delete a timetable
 */
export async function deleteTimetable(id: number) {
  try {
    await prisma.timetable.delete({
      where: { id },
    });

    revalidatePath("/admin/timetables");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete timetable:", error);
    return {
      success: false,
      error: "Failed to delete timetable",
    };
  }
}

/**
 * Publish a timetable
 */
export async function publishTimetable(id: number) {
  try {
    const timetable = await prisma.timetable.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    revalidatePath("/admin/timetables");
    revalidatePath(`/admin/timetables/${id}`);

    return { success: true, timetable };
  } catch (error: any) {
    console.error("Failed to publish timetable:", error);
    return {
      success: false,
      error: "Failed to publish timetable",
    };
  }
}

/**
 * Archive a timetable
 */
export async function archiveTimetable(id: number) {
  try {
    const timetable = await prisma.timetable.update({
      where: { id },
      data: {
        status: "ARCHIVED",
      },
    });

    revalidatePath("/admin/timetables");
    revalidatePath(`/admin/timetables/${id}`);

    return { success: true, timetable };
  } catch (error: any) {
    console.error("Failed to archive timetable:", error);
    return {
      success: false,
      error: "Failed to archive timetable",
    };
  }
}

/**
 * Get filter options for a timetable (rooms, instructors, groups used in assignments)
 */
export async function getTimetableFilterOptions(timetableId: number) {
  const assignments = await prisma.assignment.findMany({
    where: { timetableId },
    select: {
      room: { select: { id: true, name: true, building: true } },
      instructor: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
    },
    distinct: ["roomId", "instructorId", "groupId"],
  });

  // Extract unique values
  const roomsMap = new Map();
  const instructorsMap = new Map();
  const groupsMap = new Map();

  assignments.forEach((assignment) => {
    roomsMap.set(assignment.room.id, assignment.room);
    instructorsMap.set(assignment.instructor.id, assignment.instructor);
    groupsMap.set(assignment.group.id, assignment.group);
  });

  return {
    rooms: Array.from(roomsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    instructors: Array.from(instructorsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    groups: Array.from(groupsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  };
}

/**
 * Update assignment time and day
 */
export interface UpdateAssignmentInput {
  assignmentId: number;
  day?: string;
  startTime?: string;
  endTime?: string;
  roomId?: number;
  instructorId?: number;
}

export interface ConflictInfo {
  type: string;
  message: string;
}

export interface UpdateAssignmentResult {
  success: boolean;
  error?: string;
  conflicts?: ConflictInfo[];
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Validate assignment update against hard constraints
 */
async function validateAssignmentUpdate(
  assignmentId: number,
  timetableId: number,
  updates: {
    day?: string;
    startTime?: string;
    endTime?: string;
    roomId?: number;
    instructorId?: number;
  }
): Promise<ConflictInfo[]> {
  const conflicts: ConflictInfo[] = [];

  // Get the assignment being updated
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: true,
      room: true,
      instructor: true,
      group: true,
    },
  });

  if (!assignment) {
    return [{ type: "not_found", message: "Assignment not found" }];
  }

  // Determine final values after update
  const finalDay = (updates.day ?? assignment.day) as any;
  const finalStartTime = updates.startTime ?? assignment.startTime;
  const finalEndTime = updates.endTime ?? assignment.endTime;
  const finalRoomId = updates.roomId ?? assignment.roomId;
  const finalInstructorId = updates.instructorId ?? assignment.instructorId;

  const startMinutes = timeToMinutes(finalStartTime);
  const endMinutes = timeToMinutes(finalEndTime);

  // Check for room conflicts
  const roomConflicts = await prisma.assignment.findMany({
    where: {
      id: { not: assignmentId },
      timetableId,
      day: finalDay,
      roomId: finalRoomId,
      OR: [
        {
          AND: [
            { startTime: { lte: finalStartTime } },
            { endTime: { gt: finalStartTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: finalEndTime } },
            { endTime: { gte: finalEndTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: finalStartTime } },
            { endTime: { lte: finalEndTime } },
          ],
        },
      ],
    },
    include: {
      room: true,
    },
  });

  if (roomConflicts.length > 0) {
    const room = await prisma.room.findUnique({ where: { id: finalRoomId } });
    conflicts.push({
      type: "room_conflict",
      message: `Room ${room?.name || "unknown"} is already booked at this time`,
    });
  }

  // Check for instructor conflicts
  const instructorConflicts = await prisma.assignment.findMany({
    where: {
      id: { not: assignmentId },
      timetableId,
      day: finalDay,
      instructorId: finalInstructorId,
      OR: [
        {
          AND: [
            { startTime: { lte: finalStartTime } },
            { endTime: { gt: finalStartTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: finalEndTime } },
            { endTime: { gte: finalEndTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: finalStartTime } },
            { endTime: { lte: finalEndTime } },
          ],
        },
      ],
    },
    include: {
      instructor: true,
    },
  });

  if (instructorConflicts.length > 0) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: finalInstructorId },
    });
    conflicts.push({
      type: "instructor_conflict",
      message: `Instructor ${instructor?.name || "unknown"} is already teaching at this time`,
    });
  }

  // Check for student group conflicts
  const groupConflicts = await prisma.assignment.findMany({
    where: {
      id: { not: assignmentId },
      timetableId,
      day: finalDay,
      groupId: assignment.groupId,
      OR: [
        {
          AND: [
            { startTime: { lte: finalStartTime } },
            { endTime: { gt: finalStartTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: finalEndTime } },
            { endTime: { gte: finalEndTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: finalStartTime } },
            { endTime: { lte: finalEndTime } },
          ],
        },
      ],
    },
    include: {
      group: true,
    },
  });

  if (groupConflicts.length > 0) {
    conflicts.push({
      type: "group_conflict",
      message: `Student group ${assignment.group.name} already has a class at this time`,
    });
  }

  // Check room capacity if room changed
  if (updates.roomId && updates.roomId !== assignment.roomId) {
    const newRoom = await prisma.room.findUnique({
      where: { id: updates.roomId },
    });

    if (newRoom && newRoom.capacity < assignment.group.size) {
      conflicts.push({
        type: "capacity_conflict",
        message: `Room ${newRoom.name} capacity (${newRoom.capacity}) is less than group size (${assignment.group.size})`,
      });
    }

    // Check room type match
    if (assignment.course.roomType && newRoom?.type !== assignment.course.roomType) {
      conflicts.push({
        type: "room_type_conflict",
        message: `Course requires ${assignment.course.roomType} but room is ${newRoom?.type}`,
      });
    }
  }

  return conflicts;
}

export async function updateAssignment(
  input: UpdateAssignmentInput
): Promise<UpdateAssignmentResult> {
  try {
    const { assignmentId, day, startTime, endTime, roomId, instructorId } = input;

    // Get the assignment to find its timetable
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      return {
        success: false,
        error: "Assignment not found",
      };
    }

    // Calculate end time if only start time is provided
    let finalEndTime = endTime;
    if (startTime && !endTime) {
      const duration = assignment.course.duration;
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      finalEndTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
    }

    // Build update object
    const updates: any = {};
    if (day) updates.day = day;
    if (startTime) updates.startTime = startTime;
    if (finalEndTime) updates.endTime = finalEndTime;
    if (roomId) updates.roomId = roomId;
    if (instructorId) updates.instructorId = instructorId;

    // Validate the update
    const conflicts = await validateAssignmentUpdate(
      assignmentId,
      assignment.timetableId,
      updates
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts,
      };
    }

    // Perform the update
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: updates,
    });

    // Revalidate the timetable page
    revalidatePath(`/admin/timetables/${assignment.timetableId}`);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Failed to update assignment:", error);
    return {
      success: false,
      error: "Failed to update assignment",
    };
  }
}
