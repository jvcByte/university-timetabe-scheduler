import { requireStudent } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getPublishedTimetablesForStudent } from "@/actions/timetables";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function StudentSchedulePage() {
  const session = await requireStudent();

  // Get the student record for this user
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      group: true,
    },
  });

  const studentGroup = student?.group;

  if (!student || !studentGroup) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/student">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            No Student Group
          </h2>
          <p className="text-yellow-800">
            Your account is not linked to a student group. Please contact the
            administrator to assign you to a group.
          </p>
        </div>
      </div>
    );
  }

  // Get published timetables for this student group
  const { timetables } = await getPublishedTimetablesForStudent(
    studentGroup.id
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/student">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Class Schedule</h1>
        <p className="text-gray-600">
          View your published class schedules for {studentGroup.name}
        </p>
      </div>

      {timetables.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            No published schedules available yet.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Published timetables will appear here once they are available.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {timetables.map((timetable) => (
            <div
              key={timetable.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">{timetable.name}</h2>
                  <Link href={`/student/schedule/${timetable.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>
                    📅 {timetable.semester} {timetable.academicYear}
                  </span>
                  <span>
                    📊 {timetable._count.assignments} total assignments
                  </span>
                  {timetable.publishedAt && (
                    <span>
                      ✅ Published on{" "}
                      {new Date(timetable.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
