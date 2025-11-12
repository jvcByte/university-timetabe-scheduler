import { requireAdmin } from "@/lib/auth-utils";
import { searchCourses } from "@/lib/courses";
import { StudentGroupForm } from "@/components/student-group-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewStudentGroupPage() {
  await requireAdmin();

  // Fetch all courses for the multi-select
  const courses = await searchCourses("", 1000);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin/groups"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Student Groups
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Student Group
          </h1>
          <StudentGroupForm courses={courses} />
        </div>
      </div>
    </div>
  );
}
