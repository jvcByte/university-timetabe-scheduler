import { requireAdmin } from "@/lib/auth-utils";
import { getCourseById } from "@/lib/courses";
import { getDepartments } from "@/lib/departments";
import { CourseForm } from "@/components/course-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const courseId = parseInt(id);

  if (isNaN(courseId)) {
    notFound();
  }

  const [course, departments] = await Promise.all([
    getCourseById(courseId),
    getDepartments(),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/admin/courses/${course.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Course</h1>
          <CourseForm course={course} departments={departments} />
        </div>
      </div>
    </div>
  );
}
