"use server";

import { prisma } from "@/lib/db";
import { getTimetableByIdWithFilters } from "./timetables";

export interface ExportFilters {
  roomId?: number;
  instructorId?: number;
  groupId?: number;
}

export interface ExportTimetableResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Get timetable data formatted for export
 */
export async function getTimetableExportData(
  timetableId: number,
  filters?: ExportFilters
) {
  try {
    const timetable = await getTimetableByIdWithFilters(timetableId, filters);

    if (!timetable) {
      return {
        success: false,
        error: "Timetable not found",
      };
    }

    // Format assignments for export
    const exportData = {
      timetable: {
        id: timetable.id,
        name: timetable.name,
        semester: timetable.semester,
        academicYear: timetable.academicYear,
        status: timetable.status,
        fitnessScore: timetable.fitnessScore,
        createdAt: timetable.createdAt,
        publishedAt: timetable.publishedAt,
      },
      assignments: timetable.assignments.map((assignment) => ({
        id: assignment.id,
        day: assignment.day,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        course: {
          code: assignment.course.code,
          title: assignment.course.title,
          duration: assignment.course.duration,
        },
        instructor: {
          name: assignment.instructor.name,
          email: assignment.instructor.email,
        },
        room: {
          name: assignment.room.name,
          building: assignment.room.building,
          capacity: assignment.room.capacity,
          type: assignment.room.type,
        },
        group: {
          name: assignment.group.name,
          program: assignment.group.program,
          year: assignment.group.year,
          size: assignment.group.size,
        },
      })),
    };

    return {
      success: true,
      data: exportData,
    };
  } catch (error: any) {
    console.error("Failed to get timetable export data:", error);
    return {
      success: false,
      error: "Failed to get timetable data",
    };
  }
}

/**
 * Get filter labels for export
 */
export async function getExportFilterLabels(filters?: ExportFilters) {
  const labels: string[] = [];

  if (filters?.roomId) {
    const room = await prisma.room.findUnique({
      where: { id: filters.roomId },
      select: { name: true, building: true },
    });
    if (room) {
      labels.push(`Room: ${room.name} (${room.building})`);
    }
  }

  if (filters?.instructorId) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: filters.instructorId },
      select: { name: true },
    });
    if (instructor) {
      labels.push(`Instructor: ${instructor.name}`);
    }
  }

  if (filters?.groupId) {
    const group = await prisma.studentGroup.findUnique({
      where: { id: filters.groupId },
      select: { name: true },
    });
    if (group) {
      labels.push(`Group: ${group.name}`);
    }
  }

  return labels;
}
