import { requireAdmin } from "@/lib/auth-utils";
import { getAllConstraintConfigs } from "@/lib/constraints";
import { TimetableGenerationForm } from "@/components/timetable-generation-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function GenerateTimetablePage() {
  await requireAdmin();

  // Fetch constraint configurations
  const constraintConfigs = await getAllConstraintConfigs();

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
            Generate Timetable
          </h1>
          <p className="text-gray-600 mb-6">
            Create a new optimized timetable using the constraint solver. This
            process may take several minutes depending on the complexity of your
            scheduling requirements.
          </p>

          <TimetableGenerationForm constraintConfigs={constraintConfigs} />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Before you start:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Ensure all courses, instructors, rooms, and groups are set up</li>
            <li>Verify instructor availability is configured</li>
            <li>Check that constraint configuration is appropriate</li>
            <li>The solver will attempt to satisfy all hard constraints</li>
            <li>Soft constraints will be optimized based on their weights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
