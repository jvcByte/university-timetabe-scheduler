import { requireAdmin } from "@/lib/auth-utils";
import { getTimetableById } from "@/actions/timetables";
import { prisma } from "@/lib/db";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditableTimetableView } from "@/components/editable-timetable-view";

interface TimetableEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TimetableEditPage({
  params,
}: TimetableEditPageProps) {
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

  // Get all rooms and instructors for the edit dialog
  const [allRooms, allInstructors] = await Promise.all([
    prisma.room.findMany({
      select: {
        id: true,
        name: true,
        building: true,
        capacity: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.instructor.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Get filter options from assignments
  const assignments = timetable.assignments;
  const roomsMap = new Map();
  const instructorsMap = new Map();
  const groupsMap = new Map();

  assignments.forEach((assignment) => {
    roomsMap.set(assignment.room.id, {
      id: assignment.room.id,
      name: assignment.room.name,
      building: assignment.room.building,
      capacity: assignment.room.capacity,
    });
    instructorsMap.set(assignment.instructor.id, {
      id: assignment.instructor.id,
      name: assignment.instructor.name,
    });
    groupsMap.set(assignment.group.id, {
      id: assignment.group.id,
      name: assignment.group.name,
    });
  });

  const filterOptions = {
    rooms: Array.from(roomsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    instructors: Array.from(instructorsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    groups: Array.from(groupsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  };

  const violations = timetable.violations as any[];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href={`/admin/timetables/${timetableId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Timetable
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Timetable: {timetable.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {timetable.semester} • {timetable.academicYear}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Drag assignments to reschedule or click to edit details
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
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(timetable.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Editable Timetable View */}
        {timetable.assignments.length > 0 ? (
          <EditableTimetableView
            timetableId={timetableId}
            initialAssignments={timetable.assignments}
            filterOptions={filterOptions}
            allRooms={allRooms}
            allInstructors={allInstructors}
            violations={violations}
          />
        ) : (
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
