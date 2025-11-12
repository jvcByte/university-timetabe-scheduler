import { requireAdmin } from "@/lib/auth-utils";
import { getTimetables } from "@/actions/timetables";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, CheckCircle, Clock, Archive } from "lucide-react";
import Link from "next/link";

export default async function TimetablesPage() {
  await requireAdmin();

  // Fetch timetables
  const { timetables } = await getTimetables({ pageSize: 50 });

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

        {timetables.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No timetables yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by generating your first timetable
            </p>
            <Link href="/admin/timetables/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Timetable
              </Button>
            </Link>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
