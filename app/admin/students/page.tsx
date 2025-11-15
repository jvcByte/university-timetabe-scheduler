import { requireAdmin } from "@/lib/auth-utils";
import { getStudents } from "@/lib/students";
import { getStudentGroups } from "@/lib/student-groups";
import { getDepartments } from "@/lib/departments";
import { StudentsTable } from "@/components/students-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    departmentId?: string;
    year?: string;
    semester?: string;
    groupId?: string;
    hasGroup?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const departmentId = params.departmentId ? Number(params.departmentId) : undefined;
  const year = params.year ? Number(params.year) : undefined;
  const semester = params.semester ? Number(params.semester) : undefined;
  const groupId = params.groupId ? Number(params.groupId) : undefined;
  const hasGroup = params.hasGroup === "yes" ? true : params.hasGroup === "no" ? false : undefined;

  const [{ students, pagination }, departments, { groups: studentGroups }] = await Promise.all([
    getStudents({ page, search, departmentId, year, semester, groupId, hasGroup }),
    getDepartments(),
    getStudentGroups({ page: 1, pageSize: 1000 }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">
            Manage individual students and their group assignments
          </p>
        </div>
        <Link href="/admin/students/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>

      <StudentsTable
        students={students}
        pagination={pagination}
        departments={departments}
        studentGroups={studentGroups}
        currentSearch={search}
        currentDepartmentId={departmentId}
        currentYear={year}
        currentSemester={semester}
        currentGroupId={groupId}
        currentHasGroup={hasGroup}
      />
    </div>
  );
}
