import { requireStudent } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getPublishedTimetablesForStudent } from "@/actions/timetables";
import { getStudentDashboardData } from "@/lib/dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BookOpen, GraduationCap, MapPin } from "lucide-react";

export default async function StudentDashboard() {
  const session = await requireStudent();

  // Get the student record for this user
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      department: true,
      group: {
        include: {
          courses: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  const studentGroup = student?.group;

  // Get published timetables if student group exists
  let timetables: any[] = [];
  let dashboardData: any = null;
  
  if (studentGroup) {
    const result = await getPublishedTimetablesForStudent(studentGroup.id);
    timetables = result.timetables || [];
    dashboardData = await getStudentDashboardData(session.user.id);
  }

  // Helper function to get day name
  const getDayName = (day: string) => {
    return day.charAt(0) + day.slice(1).toLowerCase();
  };

  // Helper function to group assignments by day
  const groupAssignmentsByDay = (assignments: any[]) => {
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    const grouped: Record<string, any[]> = {};
    
    days.forEach(day => {
      grouped[day] = assignments.filter(a => a.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return grouped;
  };

  return (
    <div className="p-8">

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Schedule */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
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
          ) : !dashboardData || dashboardData.assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No published schedules available yet.
              </p>
              <p className="text-sm text-gray-400">
                Your class schedule will appear here once published.
              </p>
            </div>
          ) : (
            <>
              {/* Weekly Schedule Overview */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">This Week&apos;s Classes</h3>
                <div className="space-y-2">
                  {Object.entries(groupAssignmentsByDay(dashboardData.upcomingClasses)).map(([day, dayAssignments]) => {
                    if ((dayAssignments as any[]).length === 0) return null;
                    return (
                      <div key={day} className="border rounded-lg p-3 bg-gray-50">
                        <div className="font-medium text-sm text-gray-900 mb-2">
                          {getDayName(day)}
                        </div>
                        <div className="space-y-2">
                          {(dayAssignments as any[]).map((assignment) => (
                            <div
                              key={assignment.id}
                              className="bg-white border border-gray-200 rounded p-3 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-blue-600">
                                      {assignment.course.code}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {assignment.startTime} - {assignment.endTime}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700 mb-1">
                                    {assignment.course.title}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {assignment.room.name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {assignment.instructor.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Published Timetables */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Published Timetables</h3>
                <div className="space-y-2">
                  {timetables.slice(0, 3).map((timetable) => (
                    <div
                      key={timetable.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{timetable.name}</div>
                          <div className="text-xs text-gray-600">
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
                      <Button variant="link" className="w-full text-sm">
                        View all schedules →
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/student/schedule">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Schedule
                </Button>
              </Link>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
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
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No courses enrolled yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {studentGroup.courses.map((courseGroup) => (
                  <div
                    key={courseGroup.course.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{courseGroup.course.code}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {courseGroup.course.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{courseGroup.course.credits} credits</span>
                      <span>•</span>
                      <span>{courseGroup.course.duration} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Info */}
          {studentGroup && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold mb-4">Academic Info</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Group</span>
                  <span className="font-semibold text-sm">{studentGroup.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Program</span>
                  <span className="font-semibold text-sm">{studentGroup.program}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Year</span>
                  <span className="font-semibold">{studentGroup.year}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Semester</span>
                  <span className="font-semibold">{studentGroup.semester}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Courses</span>
                  <span className="font-semibold">{studentGroup.courses.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
