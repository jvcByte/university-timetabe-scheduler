import { requireAdmin } from "@/lib/auth-utils";
import { getCourseById } from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const courseId = parseInt(id);

  if (isNaN(courseId)) {
    notFound();
  }

  const course = await getCourseById(courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
          <Link href={`/admin/courses/${course.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Course
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{course.code}</h1>
            <p className="text-xl text-gray-600 mt-2">{course.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Department
            </h3>
            <p className="text-lg">{course.department}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Credits</h3>
            <p className="text-lg">{course.credits}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Duration
            </h3>
            <p className="text-lg">{course.duration} minutes</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Room Type
            </h3>
            <p className="text-lg">{course.roomType || "Any"}</p>
          </div>
        </div>

        {course.instructors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Instructors
            </h3>
            <div className="space-y-2">
              {course.instructors.map((ci) => (
                <div
                  key={ci.instructorId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium">{ci.instructor.name}</p>
                    <p className="text-sm text-gray-600">
                      {ci.instructor.email}
                    </p>
                  </div>
                  {ci.isPrimary && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {course.groups.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Student Groups
            </h3>
            <div className="space-y-2">
              {course.groups.map((cg) => (
                <div
                  key={cg.groupId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium">{cg.group.name}</p>
                    <p className="text-sm text-gray-600">
                      {cg.group.program} - Year {cg.group.year} - {cg.group.size}{" "}
                      students
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(course.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{" "}
              {new Date(course.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
