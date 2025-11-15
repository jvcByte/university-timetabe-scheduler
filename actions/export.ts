"use server";

import { prisma } from "@/lib/db";
import { getTimetableByIdWithFilters } from "./timetables";
import {
  logError,
  logInfo,
  assertExists,
} from "@/lib/error-handling";

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
): Promise<ExportTimetableResult> {
  try {
    // Fetch timetable with filters
    const timetable = await getTimetableByIdWithFilters(timetableId, filters);

    if (!timetable) {
      return {
        success: false,
        error: "Timetable not found. It may have been deleted.",
      };
    }

    // Check if timetable has assignments
    if (!timetable.assignments || timetable.assignments.length === 0) {
      return {
        success: false,
        error: "Timetable has no assignments to export. Please generate a timetable first.",
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

    logInfo("getTimetableExportData", "Timetable data prepared for export", {
      timetableId,
      assignmentCount: exportData.assignments.length,
      filters,
    });

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    logError("getTimetableExportData", error, { timetableId, filters });
    
    return {
      success: false,
      error: "Failed to prepare timetable data for export. Please try again.",
    };
  }
}

/**
 * Get filter labels for export
 */
export async function getExportFilterLabels(
  filters?: ExportFilters
): Promise<string[]> {
  try {
    const labels: string[] = [];

    // Fetch room label
    if (filters?.roomId) {
      try {
        const room = await prisma.room.findUnique({
          where: { id: filters.roomId },
          select: { name: true, building: true },
        });
        
        if (room) {
          labels.push(`Room: ${room.name} (${room.building})`);
        }
      } catch (error) {
        logError("getExportFilterLabels", error, { 
          filter: "room", 
          roomId: filters.roomId 
        });
      }
    }

    // Fetch instructor label
    if (filters?.instructorId) {
      try {
        const instructor = await prisma.instructor.findUnique({
          where: { id: filters.instructorId },
          select: { name: true },
        });
        
        if (instructor) {
          labels.push(`Instructor: ${instructor.name}`);
        }
      } catch (error) {
        logError("getExportFilterLabels", error, { 
          filter: "instructor", 
          instructorId: filters.instructorId 
        });
      }
    }

    // Fetch group label
    if (filters?.groupId) {
      try {
        const group = await prisma.studentGroup.findUnique({
          where: { id: filters.groupId },
          select: { name: true },
        });
        
        if (group) {
          labels.push(`Group: ${group.name}`);
        }
      } catch (error) {
        logError("getExportFilterLabels", error, { 
          filter: "group", 
          groupId: filters.groupId 
        });
      }
    }

    return labels;
  } catch (error) {
    logError("getExportFilterLabels", error, { filters });
    return [];
  }
}
