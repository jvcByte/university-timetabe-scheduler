import { requireAdmin } from "@/lib/auth-utils";
import { getStudentById } from "@/lib/students";
import { getStudentGroups } from "@/lib/student-groups";
import { getDepartments } from "@/lib/departments";
import { StudentForm } from "@/components/student-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditStudentPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const [student, { groups: studentGroups }, departments] = await Promise.all([
    getStudentById(Number(id)),
    getStudentGroups({ page: 1, pageSize: 1000 }),
    getDepartments(),
  ]);

  if (!student) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin/students"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Student</h1>
          <StudentForm student={student} departments={departments} studentGroups={studentGroups} />
        </div>
      </div>
    </div>
  );
}
