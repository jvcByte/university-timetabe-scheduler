import { requireAdmin } from "@/lib/auth-utils";
import { getStudentGroupById } from "@/lib/student-groups";
import { searchCourses } from "@/lib/courses";
import { StudentGroupForm } from "@/components/student-group-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditStudentGroupPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const [group, courses] = await Promise.all([
    getStudentGroupById(Number(id)),
    searchCourses("", 1000),
  ]);

  if (!group) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/admin/groups/${id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Group Details
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Student Group
          </h1>
          <StudentGroupForm group={group} courses={courses} />
        </div>
      </div>
    </div>
  );
}
