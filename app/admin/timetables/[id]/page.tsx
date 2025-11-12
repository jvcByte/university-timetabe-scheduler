import { requireAdmin } from "@/lib/auth-utils";
import { getTimetableById } from "@/actions/timetables";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface TimetableDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TimetableDetailPage({
  params,
}: TimetableDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const timetableId = parseInt(id);
  if (isNaN(timetableId)) {
    notFound();
  }

  const timetable = await getTimetableById(timetableId);

  if (!timetable) {
    notFound();
  }

  // Group assignments by day
  const assignmentsByDay = timetable.assignments.reduce((acc, assignment) => {
    if (!acc[assignment.day]) {
      acc[assignment.day] = [];
    }
    acc[assignment.day].push(assignment);
    return acc;
  }, {} as Record<string, typeof timetable.assignments>);

  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  const violations = timetable.violations as any[];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/admin/timetables"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Timetables
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {timetable.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {timetable.semester} • {timetable.academicYear}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                timetable.status === "PUBLISHED"
                  ? "bg-green-100 text-green-800"
                  : timetable.status === "GENERATED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {timetable.status}
            </span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {timetable.assignments.length}
              </p>
            </div>
            {timetable.fitnessScore !== null && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Fitness Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {timetable.fitnessScore.toFixed(2)}
                </p>
              </div>
            )}
            {violations && violations.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-600">Soft Violations</p>
                <p className="text-2xl font-bold text-amber-900">
                  {violations.length}
                </p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(timetable.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Violations */}
        {violations && violations.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  Soft Constraint Violations
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  The timetable has {violations.length} soft constraint
                  violations. These are preferences that could not be fully
                  satisfied.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assignments by Day */}
        <div className="space-y-6">
          {days.map((day) => {
            const dayAssignments = assignmentsByDay[day] || [];
            if (dayAssignments.length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {day}
                </h2>
                <div className="space-y-3">
                  {dayAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {assignment.startTime} - {assignment.endTime}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="font-semibold text-blue-600">
                              {assignment.course.code}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {assignment.course.title}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              Instructor: {assignment.instructor.name}
                            </span>
                            <span>Room: {assignment.room.name}</span>
                            <span>Group: {assignment.group.name}</span>
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

        {timetable.assignments.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assignments
            </h3>
            <p className="text-gray-600">
              This timetable has no assignments yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
