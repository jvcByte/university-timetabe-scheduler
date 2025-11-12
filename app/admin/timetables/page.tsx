import { requireAdmin } from "@/lib/auth-utils";
import { getTimetables, getTimetableSemesters } from "@/actions/timetables";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, CheckCircle, Clock, Archive, X } from "lucide-react";
import Link from "next/link";

interface TimetablesPageProps {
  searchParams: Promise<{
    status?: string;
    semester?: string;
    page?: string;
  }>;
}

export default async function TimetablesPage({
  searchParams,
}: TimetablesPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const status = params.status;
  const semester = params.semester;
  const page = parseInt(params.page || "1");

  // Fetch timetables with filters
  const { timetables, pagination } = await getTimetables({
    page,
    pageSize: 20,
    status,
    semester,
  });

  // Fetch available semesters for filter
  const semesters = await getTimetableSemesters();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "GENERATED":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "GENERATING":
        return <Clock className="h-4 w-4 text-amber-600 animate-pulse" />;
      case "ARCHIVED":
        return <Archive className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "GENERATED":
        return "bg-blue-100 text-blue-800";
      case "GENERATING":
        return "bg-amber-100 text-amber-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const buildFilterUrl = (newFilters: {
    status?: string;
    semester?: string;
  }) => {
    const params = new URLSearchParams();
    const finalStatus = newFilters.status ?? status;
    const finalSemester = newFilters.semester ?? semester;

    if (finalStatus) params.set("status", finalStatus);
    if (finalSemester) params.set("semester", finalSemester);

    return `/admin/timetables${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const hasActiveFilters = status || semester;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timetables</h1>
            <p className="text-gray-600 mt-1">
              Generate and manage course timetables
            </p>
          </div>
          <Link href="/admin/timetables/generate">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Timetable
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Status
              </label>
              <Select value={status || "all"}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <Link href={buildFilterUrl({ status: undefined })}>
                    <SelectItem value="all">All statuses</SelectItem>
                  </Link>
                  <Link href={buildFilterUrl({ status: "DRAFT" })}>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </Link>
                  <Link href={buildFilterUrl({ status: "GENERATING" })}>
                    <SelectItem value="GENERATING">Generating</SelectItem>
                  </Link>
                  <Link href={buildFilterUrl({ status: "GENERATED" })}>
                    <SelectItem value="GENERATED">Generated</SelectItem>
                  </Link>
                  <Link href={buildFilterUrl({ status: "PUBLISHED" })}>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </Link>
                  <Link href={buildFilterUrl({ status: "ARCHIVED" })}>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </Link>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Semester
              </label>
              <Select value={semester || "all"}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <Link href={buildFilterUrl({ semester: undefined })}>
                    <SelectItem value="all">All semesters</SelectItem>
                  </Link>
                  {semesters.map((s) => (
                    <Link
                      key={s.label}
                      href={buildFilterUrl({ semester: s.semester })}
                    >
                      <SelectItem value={s.semester}>{s.label}</SelectItem>
                    </Link>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <Link href="/admin/timetables">
                  <Button variant="outline" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {timetables.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters
                ? "No timetables match your filters"
                : "No timetables yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? "Try adjusting your filters or clear them to see all timetables"
                : "Get started by generating your first timetable"}
            </p>
            {!hasActiveFilters && (
              <Link href="/admin/timetables/generate">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Timetable
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fitness Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timetables.map((timetable) => (
                    <tr key={timetable.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {timetable.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {timetable.academicYear}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {timetable.semester}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            timetable.status
                          )}`}
                        >
                          {getStatusIcon(timetable.status)}
                          <span className="ml-1">{timetable.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timetable._count.assignments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timetable.fitnessScore !== null
                          ? timetable.fitnessScore.toFixed(2)
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(timetable.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/timetables/${timetable.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4 mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} total)
                </div>
                <div className="flex gap-2">
                  {pagination.page > 1 && (
                    <Link
                      href={`${buildFilterUrl({})}&page=${pagination.page - 1}`}
                    >
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                    </Link>
                  )}
                  {pagination.page < pagination.totalPages && (
                    <Link
                      href={`${buildFilterUrl({})}&page=${pagination.page + 1}`}
                    >
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
