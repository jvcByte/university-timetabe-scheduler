import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";

// Entity types for import/export
export type EntityType = "courses" | "instructors" | "rooms" | "studentGroups";

// Validation schemas for each entity type
export const courseImportSchema = z.object({
  code: z.string().min(2).max(20),
  title: z.string().min(3).max(200),
  duration: z.coerce.number().int().min(30).max(300),
  credits: z.coerce.number().int().min(1).max(10),
  departmentCode: z.string().min(1),
  roomType: z.string().max(50).optional().nullable(),
});

export const instructorImportSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  departmentCode: z.string().min(1),
  teachingLoad: z.coerce.number().int().min(1).max(40),
});

export const roomImportSchema = z.object({
  name: z.string().min(1).max(50),
  building: z.string().min(1).max(100),
  capacity: z.coerce.number().int().min(1).max(1000),
  type: z.string().min(1).max(50),
  equipment: z.string().optional().nullable(), // comma-separated list
});

export const studentGroupImportSchema = z.object({
  name: z.string().min(1).max(100),
  program: z.string().min(1).max(100),
  year: z.coerce.number().int().min(1).max(6),
  semester: z.coerce.number().int().min(1).max(12),
  size: z.coerce.number().int().min(1).max(500),
});

// Import result types
export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ImportResult<T = any> {
  success: boolean;
  data?: T[];
  errors?: ImportValidationError[];
  validCount?: number;
  errorCount?: number;
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): ImportResult<Record<string, any>> {
  try {
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      return {
        success: false,
        errors: result.errors.map((error, index) => ({
          row: error.row || index,
          field: "parse",
          message: error.message,
        })),
      };
    }

    return {
      success: true,
      data: result.data as Record<string, any>[],
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          row: 0,
          field: "parse",
          message: error instanceof Error ? error.message : "Failed to parse CSV",
        },
      ],
    };
  }
}

/**
 * Parse Excel file content
 */
export function parseExcel(buffer: ArrayBuffer): ImportResult<Record<string, any>> {
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    
    // Use first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        errors: [
          {
            row: 0,
            field: "parse",
            message: "No sheets found in Excel file",
          },
        ],
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    });

    return {
      success: true,
      data: data as Record<string, any>[],
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          row: 0,
          field: "parse",
          message: error instanceof Error ? error.message : "Failed to parse Excel file",
        },
      ],
    };
  }
}

/**
 * Validate imported data against schema
 */
export function validateImportData<T>(
  data: Record<string, any>[],
  schema: z.ZodSchema<T>
): ImportResult<T> {
  const validData: T[] = [];
  const errors: ImportValidationError[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because: 0-indexed + header row
    
    try {
      const validated = schema.parse(row);
      validData.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            row: rowNumber,
            field: err.path.join("."),
            message: err.message,
            value: row[err.path[0] as string],
          });
        });
      } else {
        errors.push({
          row: rowNumber,
          field: "unknown",
          message: error instanceof Error ? error.message : "Validation failed",
        });
      }
    }
  });

  return {
    success: errors.length === 0,
    data: validData,
    errors: errors.length > 0 ? errors : undefined,
    validCount: validData.length,
    errorCount: errors.length,
  };
}

/**
 * Get validation schema for entity type
 */
export function getImportSchema(entityType: EntityType): z.ZodSchema {
  switch (entityType) {
    case "courses":
      return courseImportSchema;
    case "instructors":
      return instructorImportSchema;
    case "rooms":
      return roomImportSchema;
    case "studentGroups":
      return studentGroupImportSchema;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) {
    return "";
  }

  return Papa.unparse(data, {
    header: true,
  });
}

/**
 * Convert data to Excel format
 */
export function convertToExcel(
  data: Record<string, any>[],
  sheetName: string = "Sheet1"
): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

/**
 * Format data for export based on entity type
 */
export function formatForExport(
  entityType: EntityType,
  data: any[]
): Record<string, any>[] {
  switch (entityType) {
    case "courses":
      return data.map((course) => ({
        code: course.code,
        title: course.title,
        duration: course.duration,
        credits: course.credits,
        departmentCode: course.department?.code || "",
        roomType: course.roomType || "",
      }));
    
    case "instructors":
      return data.map((instructor) => ({
        name: instructor.name,
        email: instructor.email,
        departmentCode: instructor.department?.code || "",
        teachingLoad: instructor.teachingLoad,
      }));
    
    case "rooms":
      return data.map((room) => ({
        name: room.name,
        building: room.building,
        capacity: room.capacity,
        type: room.type,
        equipment: Array.isArray(room.equipment) 
          ? room.equipment.join(", ") 
          : room.equipment || "",
      }));
    
    case "studentGroups":
      return data.map((group) => ({
        name: group.name,
        program: group.program,
        year: group.year,
        semester: group.semester,
        size: group.size,
      }));
    
    default:
      return data;
  }
}
