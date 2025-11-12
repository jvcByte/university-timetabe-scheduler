import { requireAdmin } from "@/lib/auth-utils";
import { getInstructorById } from "@/lib/instructors";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InstructorDetailPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const instructor = await getInstructorById(Number(id));

  if (!instructor) {
    notFound();
  }

  const availability = instructor.availability as Record<string, string[]>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/instructors"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Instructors
        </Link>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{instructor.name}</h1>
              <p className="text-gray-600 mt-1">{instructor.email}</p>
            </div>
            <Link href={`/admin/instructors/${instructor.id}/edit`}>
              <Button>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="text-base font-medium">{instructor.department.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teaching Load</p>
                  <p className="text-base font-medium">{instructor.teachingLoad} hours/week</p>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
              <div className="space-y-3">
                {Object.entries(availability).map(([day, slots]) => (
                  <div key={day} className="flex items-start gap-4">
                    <div className="w-32 font-medium text-gray-700">{day}</div>
                    <div className="flex-1">
                      {slots.length === 0 ? (
                        <p className="text-gray-500 italic">Not available</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot, index) => (
                            <span
                              key={index}
                              className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Courses */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Courses</h2>
              {instructor.courses.length === 0 ? (
                <p className="text-gray-500 italic">No courses assigned</p>
              ) : (
                <div className="space-y-2">
                  {instructor.courses.map((courseInstructor) => (
                    <div
                      key={courseInstructor.courseId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{courseInstructor.course.code}</p>
                        <p className="text-sm text-gray-600">{courseInstructor.course.title}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {courseInstructor.course.department.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Account */}
            {instructor.user && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Account</h2>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Linked to user account</p>
                  <p className="font-medium">{instructor.user.name}</p>
                  <p className="text-sm text-gray-600">{instructor.user.email}</p>
                  <p className="text-sm">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mt-1">
                      {instructor.user.role}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
