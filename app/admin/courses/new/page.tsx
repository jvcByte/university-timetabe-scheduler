import { requireAdmin } from "@/lib/auth-utils";
import { getDepartments } from "@/lib/departments";
import { CourseForm } from "@/components/course-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewCoursePage() {
  await requireAdmin();
  
  const departments = await getDepartments();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Create New Course</h1>
          <CourseForm departments={departments} />
        </div>
      </div>
    </div>
  );
}
