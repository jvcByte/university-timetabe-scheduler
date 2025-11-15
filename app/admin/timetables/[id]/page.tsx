import { requireAdmin } from "@/lib/auth-utils";
import {
  getTimetableById,
  getTimetableFilterOptions,
} from "@/actions/timetables";
import { ArrowLeft, Calendar, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TimetableDetailView } from "@/components/timetable-detail-view";
import { Button } from "@/components/ui/button";
import { TimetableExportButton } from "@/components/timetable-export-button";
import { TimetablePublishButton } from "@/components/timetable-publish-button";

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

  const [timetable, filterOptions] = await Promise.all([
    getTimetableById(timetableId),
    getTimetableFilterOptions(timetableId),
  ]);

  if (!timetable) {
    notFound();
  }

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
            <div className="flex items-center gap-3">
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
              <TimetablePublishButton
                timetableId={timetableId}
                currentStatus={timetable.status}
                timetableName={timetable.name}
              />
              <TimetableExportButton
                timetableId={timetableId}
                timetableName={timetable.name}
                filterOptions={filterOptions}
              />
              <Link href={`/admin/timetables/${timetableId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Timetable
                </Button>
              </Link>
            </div>
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

        {/* Timetable Detail View with Filters and Calendar */}
        {timetable.assignments.length > 0 ? (
          <TimetableDetailView
            timetableId={timetableId}
            initialAssignments={timetable.assignments}
            filterOptions={filterOptions}
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
