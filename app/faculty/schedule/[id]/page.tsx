import { requireFaculty } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getPublishedTimetableForFaculty } from "@/actions/timetables";
import { CalendarView } from "@/components/calendar-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, List } from "lucide-react";
import { notFound } from "next/navigation";
import { SimpleExportButton } from "@/components/simple-export-button";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FacultyScheduleDetailPage({ params }: PageProps) {
  const session = await requireFaculty();
  const { id } = await params;
  const timetableId = parseInt(id);

  if (isNaN(timetableId)) {
    notFound();
  }

  // Get the instructor record for this user
  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
  });

  if (!instructor) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/faculty/schedule">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schedules
            </Button>
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            No Instructor Profile
          </h2>
          <p className="text-yellow-800">
            Your account is not linked to an instructor profile.
          </p>
        </div>
      </div>
    );
  }

  // Get the timetable with assignments filtered for this instructor
  const { timetable, error } = await getPublishedTimetableForFaculty(
    timetableId,
    instructor.id
  );

  if (!timetable || error) {
    notFound();
  }

  // Calculate statistics
  const totalClasses = timetable.assignments.length;
  const uniqueCourses = new Set(
    timetable.assignments.map((a) => a.course.code)
  ).size;
  const uniqueGroups = new Set(
    timetable.assignments.map((a) => a.group.name)
  ).size;

  // Calculate total teaching hours
  const totalMinutes = timetable.assignments.reduce((sum, assignment) => {
    const [startHours, startMinutes] = assignment.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = assignment.endTime.split(":").map(Number);
    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;
    return sum + (end - start);
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/faculty/schedule">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedules
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold">{timetable.name}</h1>
          <SimpleExportButton
            timetableId={timetableId}
            timetableName={timetable.name}
            filters={{ instructorId: instructor.id }}
          />
        </div>
        <div className="flex gap-4 text-gray-600">
          <span>
            📅 {timetable.semester} {timetable.academicYear}
          </span>
          {timetable.publishedAt && (
            <span>
              ✅ Published on{" "}
              {new Date(timetable.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Total Classes</div>
          <div className="text-2xl font-bold text-gray-900">{totalClasses}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Courses</div>
          <div className="text-2xl font-bold text-gray-900">{uniqueCourses}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Student Groups</div>
          <div className="text-2xl font-bold text-gray-900">{uniqueGroups}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Teaching Hours</div>
          <div className="text-2xl font-bold text-gray-900">
            {totalHours}h {remainingMinutes > 0 && `${remainingMinutes}m`}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {timetable.assignments.length > 0 ? (
        <CalendarView assignments={timetable.assignments} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            No classes assigned to you in this timetable.
          </p>
        </div>
      )}

      {/* List View */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <List className="h-5 w-5" />
          Class List
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Day
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Time
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Course
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Room
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Group
                </th>
              </tr>
            </thead>
            <tbody>
              {timetable.assignments
                .sort((a, b) => {
                  const dayOrder = [
                    "MONDAY",
                    "TUESDAY",
                    "WEDNESDAY",
                    "THURSDAY",
                    "FRIDAY",
                    "SATURDAY",
                    "SUNDAY",
                  ];
                  const dayDiff =
                    dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                  if (dayDiff !== 0) return dayDiff;
                  return a.startTime.localeCompare(b.startTime);
                })
                .map((assignment) => (
                  <tr key={assignment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {assignment.day.charAt(0) +
                        assignment.day.slice(1).toLowerCase()}
                    </td>
                    <td className="py-3 px-4">
                      {assignment.startTime} - {assignment.endTime}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{assignment.course.code}</div>
                      <div className="text-sm text-gray-600">
                        {assignment.course.title}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{assignment.room.name}</div>
                      <div className="text-sm text-gray-600">
                        {assignment.room.building}
                      </div>
                    </td>
                    <td className="py-3 px-4">{assignment.group.name}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
