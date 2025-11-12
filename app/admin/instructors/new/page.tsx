import { requireAdmin } from "@/lib/auth-utils";
import { getDepartments } from "@/lib/departments";
import { InstructorForm } from "@/components/instructor-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewInstructorPage() {
  await requireAdmin();
  
  const departments = await getDepartments();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin/instructors"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Instructors
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Instructor</h1>
          <InstructorForm departments={departments} />
        </div>
      </div>
    </div>
  );
}
