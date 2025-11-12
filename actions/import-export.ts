"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  parseCSV,
  parseExcel,
  validateImportData,
  getImportSchema,
  convertToCSV,
  convertToExcel,
  formatForExport,
  type EntityType,
  type ImportResult,
  type ImportValidationError,
} from "@/lib/import-export";
import { z } from "zod";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface ImportActionResult {
  success: boolean;
  imported?: number;
  errors?: ImportValidationError[];
  validCount?: number;
  errorCount?: number;
  message?: string;
}

/**
 * Import courses from CSV/Excel
 */
export async function importCourses(
  fileContent: string,
  fileType: "csv" | "excel"
): Promise<ImportActionResult> {
  try {
    // Parse file
    let parseResult: ImportResult;
    if (fileType === "csv") {
      parseResult = parseCSV(fileContent);
    } else {
      const buffer = Buffer.from(fileContent, "base64");
      parseResult = parseExcel(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    }

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors,
        message: "Failed to parse file",
      };
    }

    // Validate data
    const schema = getImportSchema("courses");
    const validationResult = validateImportData(parseResult.data, schema);

    if (!validationResult.success || !validationResult.data) {
      return {
        success: false,
        errors: validationResult.errors,
        validCount: validationResult.validCount,
        errorCount: validationResult.errorCount,
        message: `Validation failed: ${validationResult.errorCount} error(s) found`,
      };
    }

    // Get department mappings
    const departments = await prisma.department.findMany({
      select: { id: true, code: true },
    });
    const deptMap = new Map(departments.map((d) => [d.code, d.id]));

    // Import courses
    let imported = 0;
    const errors: ImportValidationError[] = [];

    for (let i = 0; i < validationResult.data.length; i++) {
      const row = validationResult.data[i];
      const rowNumber = i + 2;

      try {
        const departmentId = deptMap.get(row.departmentCode);
        if (!departmentId) {
          errors.push({
            row: rowNumber,
            field: "departmentCode",
            message: `Department with code "${row.departmentCode}" not found`,
            value: row.departmentCode,
          });
          continue;
        }

        // Check if course already exists
        const existing = await prisma.course.findUnique({
          where: { code: row.code },
        });

        if (existing) {
          errors.push({
            row: rowNumber,
            field: "code",
            message: `Course with code "${row.code}" already exists`,
            value: row.code,
          });
          continue;
        }

        // Create course
        await prisma.course.create({
          data: {
            code: row.code,
            title: row.title,
            duration: row.duration,
            credits: row.credits,
            departmentId,
            roomType: row.roomType || null,
          },
        });

        imported++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: "database",
          message: error instanceof Error ? error.message : "Failed to import row",
        });
      }
    }

    revalidatePath("/admin/courses");

    return {
      success: imported > 0,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      validCount: validationResult.validCount,
      errorCount: errors.length,
      message: `Successfully imported ${imported} course(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ""}`,
    };
  } catch (error) {
    console.error("Import courses error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to import courses",
    };
  }
}

/**
 * Import instructors from CSV/Excel
 */
export async function importInstructors(
  fileContent: string,
  fileType: "csv" | "excel"
): Promise<ImportActionResult> {
  try {
    // Parse file
    let parseResult: ImportResult;
    if (fileType === "csv") {
      parseResult = parseCSV(fileContent);
    } else {
      const buffer = Buffer.from(fileContent, "base64");
      parseResult = parseExcel(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    }

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors,
        message: "Failed to parse file",
      };
    }

    // Validate data
    const schema = getImportSchema("instructors");
    const validationResult = validateImportData(parseResult.data, schema);

    if (!validationResult.success || !validationResult.data) {
      return {
        success: false,
        errors: validationResult.errors,
        validCount: validationResult.validCount,
        errorCount: validationResult.errorCount,
        message: `Validation failed: ${validationResult.errorCount} error(s) found`,
      };
    }

    // Get department mappings
    const departments = await prisma.department.findMany({
      select: { id: true, code: true },
    });
    const deptMap = new Map(departments.map((d) => [d.code, d.id]));

    // Import instructors
    let imported = 0;
    const errors: ImportValidationError[] = [];

    for (let i = 0; i < validationResult.data.length; i++) {
      const row = validationResult.data[i];
      const rowNumber = i + 2;

      try {
        const departmentId = deptMap.get(row.departmentCode);
        if (!departmentId) {
          errors.push({
            row: rowNumber,
            field: "departmentCode",
            message: `Department with code "${row.departmentCode}" not found`,
            value: row.departmentCode,
          });
          continue;
        }

        // Check if instructor already exists
        const existing = await prisma.instructor.findUnique({
          where: { email: row.email },
        });

        if (existing) {
          errors.push({
            row: rowNumber,
            field: "email",
            message: `Instructor with email "${row.email}" already exists`,
            value: row.email,
          });
          continue;
        }

        // Create instructor with default availability
        await prisma.instructor.create({
          data: {
            name: row.name,
            email: row.email,
            departmentId,
            teachingLoad: row.teachingLoad,
            availability: {
              MONDAY: ["09:00-17:00"],
              TUESDAY: ["09:00-17:00"],
              WEDNESDAY: ["09:00-17:00"],
              THURSDAY: ["09:00-17:00"],
              FRIDAY: ["09:00-17:00"],
            },
          },
        });

        imported++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: "database",
          message: error instanceof Error ? error.message : "Failed to import row",
        });
      }
    }

    revalidatePath("/admin/instructors");

    return {
      success: imported > 0,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      validCount: validationResult.validCount,
      errorCount: errors.length,
      message: `Successfully imported ${imported} instructor(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ""}`,
    };
  } catch (error) {
    console.error("Import instructors error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to import instructors",
    };
  }
}

/**
 * Import rooms from CSV/Excel
 */
export async function importRooms(
  fileContent: string,
  fileType: "csv" | "excel"
): Promise<ImportActionResult> {
  try {
    // Parse file
    let parseResult: ImportResult;
    if (fileType === "csv") {
      parseResult = parseCSV(fileContent);
    } else {
      const buffer = Buffer.from(fileContent, "base64");
      parseResult = parseExcel(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    }

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors,
        message: "Failed to parse file",
      };
    }

    // Validate data
    const schema = getImportSchema("rooms");
    const validationResult = validateImportData(parseResult.data, schema);

    if (!validationResult.success || !validationResult.data) {
      return {
        success: false,
        errors: validationResult.errors,
        validCount: validationResult.validCount,
        errorCount: validationResult.errorCount,
        message: `Validation failed: ${validationResult.errorCount} error(s) found`,
      };
    }

    // Import rooms
    let imported = 0;
    const errors: ImportValidationError[] = [];

    for (let i = 0; i < validationResult.data.length; i++) {
      const row = validationResult.data[i];
      const rowNumber = i + 2;

      try {
        // Check if room already exists
        const existing = await prisma.room.findUnique({
          where: { name: row.name },
        });

        if (existing) {
          errors.push({
            row: rowNumber,
            field: "name",
            message: `Room with name "${row.name}" already exists`,
            value: row.name,
          });
          continue;
        }

        // Parse equipment
        const equipment = row.equipment
          ? row.equipment.split(",").map((e: string) => e.trim()).filter(Boolean)
          : [];

        // Create room
        await prisma.room.create({
          data: {
            name: row.name,
            building: row.building,
            capacity: row.capacity,
            type: row.type,
            equipment,
          },
        });

        imported++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: "database",
          message: error instanceof Error ? error.message : "Failed to import row",
        });
      }
    }

    revalidatePath("/admin/rooms");

    return {
      success: imported > 0,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      validCount: validationResult.validCount,
      errorCount: errors.length,
      message: `Successfully imported ${imported} room(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ""}`,
    };
  } catch (error) {
    console.error("Import rooms error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to import rooms",
    };
  }
}

/**
 * Import student groups from CSV/Excel
 */
export async function importStudentGroups(
  fileContent: string,
  fileType: "csv" | "excel"
): Promise<ImportActionResult> {
  try {
    // Parse file
    let parseResult: ImportResult;
    if (fileType === "csv") {
      parseResult = parseCSV(fileContent);
    } else {
      const buffer = Buffer.from(fileContent, "base64");
      parseResult = parseExcel(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    }

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors,
        message: "Failed to parse file",
      };
    }

    // Validate data
    const schema = getImportSchema("studentGroups");
    const validationResult = validateImportData(parseResult.data, schema);

    if (!validationResult.success || !validationResult.data) {
      return {
        success: false,
        errors: validationResult.errors,
        validCount: validationResult.validCount,
        errorCount: validationResult.errorCount,
        message: `Validation failed: ${validationResult.errorCount} error(s) found`,
      };
    }

    // Import student groups
    let imported = 0;
    const errors: ImportValidationError[] = [];

    for (let i = 0; i < validationResult.data.length; i++) {
      const row = validationResult.data[i];
      const rowNumber = i + 2;

      try {
        // Check if group already exists
        const existing = await prisma.studentGroup.findUnique({
          where: { name: row.name },
        });

        if (existing) {
          errors.push({
            row: rowNumber,
            field: "name",
            message: `Student group with name "${row.name}" already exists`,
            value: row.name,
          });
          continue;
        }

        // Create student group
        await prisma.studentGroup.create({
          data: {
            name: row.name,
            program: row.program,
            year: row.year,
            semester: row.semester,
            size: row.size,
          },
        });

        imported++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: "database",
          message: error instanceof Error ? error.message : "Failed to import row",
        });
      }
    }

    revalidatePath("/admin/groups");

    return {
      success: imported > 0,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      validCount: validationResult.validCount,
      errorCount: errors.length,
      message: `Successfully imported ${imported} student group(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ""}`,
    };
  } catch (error) {
    console.error("Import student groups error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to import student groups",
    };
  }
}

/**
 * Export courses to CSV
 */
export async function exportCoursesCSV(): Promise<ActionResult<string>> {
  try {
    const courses = await prisma.course.findMany({
      include: {
        department: true,
      },
      orderBy: { code: "asc" },
    });

    const formatted = formatForExport("courses", courses);
    const csv = convertToCSV(formatted);

    return {
      success: true,
      data: csv,
    };
  } catch (error) {
    console.error("Export courses CSV error:", error);
    return {
      success: false,
      error: "Failed to export courses",
    };
  }
}

/**
 * Export courses to Excel
 */
export async function exportCoursesExcel(): Promise<ActionResult<string>> {
  try {
    const courses = await prisma.course.findMany({
      include: {
        department: true,
      },
      orderBy: { code: "asc" },
    });

    const formatted = formatForExport("courses", courses);
    const buffer = convertToExcel(formatted, "Courses");
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      success: true,
      data: base64,
    };
  } catch (error) {
    console.error("Export courses Excel error:", error);
    return {
      success: false,
      error: "Failed to export courses",
    };
  }
}

/**
 * Export instructors to CSV
 */
export async function exportInstructorsCSV(): Promise<ActionResult<string>> {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        department: true,
      },
      orderBy: { name: "asc" },
    });

    const formatted = formatForExport("instructors", instructors);
    const csv = convertToCSV(formatted);

    return {
      success: true,
      data: csv,
    };
  } catch (error) {
    console.error("Export instructors CSV error:", error);
    return {
      success: false,
      error: "Failed to export instructors",
    };
  }
}

/**
 * Export instructors to Excel
 */
export async function exportInstructorsExcel(): Promise<ActionResult<string>> {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        department: true,
      },
      orderBy: { name: "asc" },
    });

    const formatted = formatForExport("instructors", instructors);
    const buffer = convertToExcel(formatted, "Instructors");
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      success: true,
      data: base64,
    };
  } catch (error) {
    console.error("Export instructors Excel error:", error);
    return {
      success: false,
      error: "Failed to export instructors",
    };
  }
}

/**
 * Export rooms to CSV
 */
export async function exportRoomsCSV(): Promise<ActionResult<string>> {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" },
    });

    const formatted = formatForExport("rooms", rooms);
    const csv = convertToCSV(formatted);

    return {
      success: true,
      data: csv,
    };
  } catch (error) {
    console.error("Export rooms CSV error:", error);
    return {
      success: false,
      error: "Failed to export rooms",
    };
  }
}

/**
 * Export rooms to Excel
 */
export async function exportRoomsExcel(): Promise<ActionResult<string>> {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" },
    });

    const formatted = formatForExport("rooms", rooms);
    const buffer = convertToExcel(formatted, "Rooms");
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      success: true,
      data: base64,
    };
  } catch (error) {
    console.error("Export rooms Excel error:", error);
    return {
      success: false,
      error: "Failed to export rooms",
    };
  }
}

/**
 * Export student groups to CSV
 */
export async function exportStudentGroupsCSV(): Promise<ActionResult<string>> {
  try {
    const groups = await prisma.studentGroup.findMany({
      orderBy: { name: "asc" },
    });

    const formatted = formatForExport("studentGroups", groups);
    const csv = convertToCSV(formatted);

    return {
      success: true,
      data: csv,
    };
  } catch (error) {
    console.error("Export student groups CSV error:", error);
    return {
      success: false,
      error: "Failed to export student groups",
    };
  }
}

/**
 * Export student groups to Excel
 */
export async function exportStudentGroupsExcel(): Promise<ActionResult<string>> {
  try {
    const groups = await prisma.studentGroup.findMany({
      orderBy: { name: "asc" },
    });

    const formatted = formatForExport("studentGroups", groups);
    const buffer = convertToExcel(formatted, "Student Groups");
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      success: true,
      data: base64,
    };
  } catch (error) {
    console.error("Export student groups Excel error:", error);
    return {
      success: false,
      error: "Failed to export student groups",
    };
  }
}
