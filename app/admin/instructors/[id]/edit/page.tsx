import { requireAdmin } from "@/lib/auth-utils";
import { getInstructorById } from "@/lib/instructors";
import { getDepartments } from "@/lib/departments";
import { InstructorForm } from "@/components/instructor-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInstructorPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const [instructor, departments] = await Promise.all([
    getInstructorById(Number(id)),
    getDepartments(),
  ]);

  if (!instructor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/admin/instructors/${instructor.id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Instructor Details
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Instructor</h1>
          <InstructorForm instructor={instructor} departments={departments} />
        </div>
      </div>
    </div>
  );
}
