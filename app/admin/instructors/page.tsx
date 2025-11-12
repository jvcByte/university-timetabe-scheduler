import { requireAdmin } from "@/lib/auth-utils";
import { getInstructors } from "@/lib/instructors";
import { getDepartments } from "@/lib/departments";
import { InstructorsTable } from "@/components/instructors-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    departmentId?: string;
  }>;
}

export default async function InstructorsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const departmentId = params.departmentId ? Number(params.departmentId) : undefined;

  const [{ instructors, pagination }, departments] = await Promise.all([
    getInstructors({ page, search, departmentId }),
    getDepartments(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-600 mt-1">
            Manage faculty members and their availability
          </p>
        </div>
        <Link href="/admin/instructors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Instructor
          </Button>
        </Link>
      </div>

      <InstructorsTable
        instructors={instructors}
        pagination={pagination}
        departments={departments}
        currentSearch={search}
        currentDepartmentId={departmentId}
      />
    </div>
  );
}
