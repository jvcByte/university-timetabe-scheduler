import { requireFaculty } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getPublishedTimetablesForFaculty } from "@/actions/timetables";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen } from "lucide-react";

export default async function FacultyDashboard() {
  const session = await requireFaculty();

  // Get the instructor record for this user
  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    include: {
      department: true,
    },
  });

  // Get published timetables if instructor exists
  let timetables: any[] = [];
  if (instructor) {
    const result = await getPublishedTimetablesForFaculty(instructor.id);
    timetables = result.timetables || [];
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Faculty Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome, {session.user.name}!
      </p>

      {/* Quick Stats */}
      {instructor && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Department</div>
                <div className="text-lg font-semibold">
                  {instructor.department.name}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Teaching Load</div>
                <div className="text-lg font-semibold">
                  {instructor.teachingLoad} hours/week
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
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
        {/* Teaching Schedule */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Teaching Schedule
          </h2>
          {!instructor ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Your account is not linked to an instructor profile. Please
                contact the administrator.
              </p>
            </div>
          ) : timetables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No published schedules available yet.
              </p>
              <p className="text-sm text-gray-400">
                Your teaching schedule will appear here once published.
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
                    <Link href={`/faculty/schedule/${timetable.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {timetables.length > 3 && (
                <Link href="/faculty/schedule">
                  <Button variant="link" className="w-full">
                    View all schedules →
                  </Button>
                </Link>
              )}
            </div>
          )}
          {instructor && (
            <div className="mt-4">
              <Link href="/faculty/schedule">
                <Button className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Schedules
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/faculty/schedule">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View My Schedule
              </Button>
            </Link>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                Additional features like availability management will be
                available in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
