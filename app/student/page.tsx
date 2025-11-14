import { requireStudent } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getPublishedTimetablesForStudent } from "@/actions/timetables";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BookOpen, GraduationCap } from "lucide-react";

export default async function StudentDashboard() {
  const session = await requireStudent();

  // Get the student group record for this user
  const studentGroup = await prisma.studentGroup.findUnique({
    where: { userId: session.user.id },
    include: {
      courses: {
        include: {
          course: true,
        },
      },
    },
  });

  // Get published timetables if student group exists
  let timetables: any[] = [];
  if (studentGroup) {
    const result = await getPublishedTimetablesForStudent(studentGroup.id);
    timetables = result.timetables || [];
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome, {session.user.name}!</p>

      {/* Quick Stats */}
      {studentGroup && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Group</div>
                <div className="text-lg font-semibold">{studentGroup.name}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Program</div>
                <div className="text-lg font-semibold">
                  {studentGroup.program}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-3 rounded-lg">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Year & Semester</div>
                <div className="text-lg font-semibold">
                  Year {studentGroup.year}, Sem {studentGroup.semester}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Published Schedules</div>
                <div className="text-lg font-semibold">{timetables.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Schedule */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Class Schedule
          </h2>
          {!studentGroup ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Your account is not linked to a student group. Please contact
                the administrator.
              </p>
            </div>
          ) : timetables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No published schedules available yet.
              </p>
              <p className="text-sm text-gray-400">
                Your class schedule will appear here once published.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timetables.slice(0, 3).map((timetable) => (
                <div
                  key={timetable.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{timetable.name}</div>
                      <div className="text-sm text-gray-600">
                        {timetable.semester} {timetable.academicYear}
                      </div>
                    </div>
                    <Link href={`/student/schedule/${timetable.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {timetables.length > 3 && (
                <Link href="/student/schedule">
                  <Button variant="link" className="w-full">
                    View all schedules →
                  </Button>
                </Link>
              )}
            </div>
          )}
          {studentGroup && (
            <div className="mt-4">
              <Link href="/student/schedule">
                <Button className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Schedules
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Enrolled Courses */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Enrolled Courses
          </h2>
          {!studentGroup ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Your account is not linked to a student group.
              </p>
            </div>
          ) : studentGroup.courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No courses enrolled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentGroup.courses.map((courseGroup) => (
                <div
                  key={courseGroup.course.id}
                  className="border rounded-lg p-4"
                >
                  <div className="font-medium">{courseGroup.course.code}</div>
                  <div className="text-sm text-gray-600">
                    {courseGroup.course.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {courseGroup.course.credits} credits •{" "}
                    {courseGroup.course.duration} minutes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
