/**
 * Student type definitions
 */

export interface StudentInput {
  studentId: string;
  name: string;
  email: string;
  year?: number;
  semester?: number;
  departmentId?: number | null;
  studentGroupId?: number | null;
  userId?: string;
}

export interface UpdateStudentInput extends StudentInput {
  id: number;
}
