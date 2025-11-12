import { requireAdmin } from "@/lib/auth-utils";
import { getStudentGroups, getPrograms } from "@/lib/student-groups";
import { StudentGroupsTable } from "@/components/student-groups-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    program?: string;
    year?: string;
    semester?: string;
  }>;
}

export default async function StudentGroupsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const program = params.program || undefined;
  const year = params.year ? Number(params.year) : undefined;
  const semester = params.semester ? Number(params.semester) : undefined;

  const [{ groups, pagination }, programs] = await Promise.all([
    getStudentGroups({ page, search, program, year, semester }),
    getPrograms(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Groups</h1>
          <p className="text-gray-600 mt-1">
            Manage student groups and their course assignments
          </p>
        </div>
        <Link href="/admin/groups/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Student Group
          </Button>
        </Link>
      </div>

      <StudentGroupsTable
        groups={groups}
        pagination={pagination}
        programs={programs}
        currentSearch={search}
        currentProgram={program}
        currentYear={year}
        currentSemester={semester}
      />
    </div>
  );
}
