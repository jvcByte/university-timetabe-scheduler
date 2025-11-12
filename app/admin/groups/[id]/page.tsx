import { requireAdmin } from "@/lib/auth-utils";
import { getStudentGroupById } from "@/lib/student-groups";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users, BookOpen, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentGroupDetailPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const group = await getStudentGroupById(Number(id));

  if (!group) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/groups"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Student Groups
        </Link>

        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <p className="text-gray-600 mt-1">{group.program}</p>
            </div>
            <Link href={`/admin/groups/${group.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Group
              </Button>
            </Link>
          </div>

          {/* Details */}
          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Academic Period</p>
                  <p className="text-lg text-gray-900">
                    Year {group.year}, Semester {group.semester}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Group Size</p>
                  <p className="text-lg text-gray-900">{group.size} students</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned Courses</p>
                  <p className="text-lg text-gray-900">{group.courses.length} courses</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Timetable Assignments</p>
                  <p className="text-lg text-gray-900">{group._count.assignments} assignments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses */}
          {group.courses.length > 0 && (
            <div className="p-6 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Assigned Courses
              </h2>
              <div className="space-y-3">
                {group.courses.map(({ course }) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-gray-900">
                          {course.code}
                        </span>
                        <span className="text-gray-600">{course.title}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{course.department.name}</span>
                        <span>•</span>
                        <span>{course.duration} minutes</span>
                        <span>•</span>
                        <span>{course.credits} credits</span>
                      </div>
                    </div>
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="p-6 border-t bg-gray-50 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>
                Created: {new Date(group.createdAt).toLocaleDateString()}
              </span>
              <span>
                Last updated: {new Date(group.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
