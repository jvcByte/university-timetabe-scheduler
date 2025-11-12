import { requireAdmin } from "@/lib/auth-utils";
import { getAllConstraintConfigs } from "@/lib/constraints";
import { TimetableGenerationForm } from "@/components/timetable-generation-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function GenerateTimetablePage() {
  await requireAdmin();

  // Fetch constraint configurations
  const constraintConfigs = await getAllConstraintConfigs();

  // Fetch data counts to show what will be scheduled
  const { prisma } = await import("@/lib/db");
  const [courseCount, instructorCount, roomCount, groupCount] =
    await Promise.all([
      prisma.course.count(),
      prisma.instructor.count(),
      prisma.room.count(),
      prisma.studentGroup.count(),
    ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin/timetables"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Timetables
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Generate School-Wide Timetable
          </h1>
          <p className="text-gray-600 mb-6">
            Create a new optimized timetable for the entire institution using the constraint solver. 
            This will generate a complete schedule for all courses, instructors, rooms, and student groups 
            for the specified semester. This process may take several minutes depending on the complexity 
            of your scheduling requirements.
          </p>

          <TimetableGenerationForm constraintConfigs={constraintConfigs} />
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-900 mb-2">
            Data to be scheduled:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-amber-700">Courses</p>
              <p className="text-2xl font-bold text-amber-900">{courseCount}</p>
            </div>
            <div>
              <p className="text-amber-700">Instructors</p>
              <p className="text-2xl font-bold text-amber-900">
                {instructorCount}
              </p>
            </div>
            <div>
              <p className="text-amber-700">Rooms</p>
              <p className="text-2xl font-bold text-amber-900">{roomCount}</p>
            </div>
            <div>
              <p className="text-amber-700">Student Groups</p>
              <p className="text-2xl font-bold text-amber-900">{groupCount}</p>
            </div>
          </div>
          {(courseCount === 0 ||
            instructorCount === 0 ||
            roomCount === 0 ||
            groupCount === 0) && (
            <p className="text-sm text-amber-800 mt-3">
              ⚠️ Warning: Some entity types have no data. Generation may fail or
              produce incomplete results.
            </p>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Before you start:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>
              <strong>This generates a complete institutional timetable</strong> - all courses, 
              instructors, rooms, and student groups in the database will be scheduled
            </li>
            <li>Ensure all academic data is complete and accurate</li>
            <li>Verify instructor availability is configured for all faculty</li>
            <li>Check that constraint configuration matches institutional policies</li>
            <li>The solver will attempt to satisfy all hard constraints (no conflicts)</li>
            <li>Soft constraints will be optimized based on their weights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
