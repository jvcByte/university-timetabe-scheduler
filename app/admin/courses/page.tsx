import { requireAdmin } from "@/lib/auth-utils";
import { getCourses } from "@/lib/courses";
import { getDepartments } from "@/lib/departments";
import { CoursesTable } from "@/components/courses-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ImportExportButtons } from "@/components/import-export-buttons";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    departmentId?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const departmentId = params.departmentId ? Number(params.departmentId) : undefined;

  const [{ courses, pagination }, departments] = await Promise.all([
    getCourses({ page, search, departmentId }),
    getDepartments(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">
            Manage course catalog and curriculum
          </p>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons entityType="courses" />
          <Link href="/admin/courses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </Link>
        </div>
      </div>

      <CoursesTable
        courses={courses}
        pagination={pagination}
        departments={departments}
        currentSearch={search}
        currentDepartmentId={departmentId}
      />
    </div>
  );
}
