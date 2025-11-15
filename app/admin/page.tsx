import { requireAdmin } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  Building, 
  Calendar, 
  Settings,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  Archive
} from "lucide-react";
import Link from "next/link";
import { 
  getEntityCounts, 
  getTimetableStatusOverview, 
  getRecentTimetables 
} from "@/lib/dashboard";

export default async function AdminDashboard() {
  const session = await requireAdmin();
  
  // Fetch dashboard data
  const entityCounts = await getEntityCounts();
  const statusOverview = await getTimetableStatusOverview();
  const recentTimetables = await getRecentTimetables(5);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome, {session.user.name}!
      </p>

      {/* Entity Count Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">System Overview</h2>
        <div className="flex flex-wrap gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Courses</div>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{entityCounts.courses}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Instructors</div>
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{entityCounts.instructors}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Rooms</div>
              <Building className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{entityCounts.rooms}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Students</div>
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{entityCounts.students}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Student Groups</div>
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{entityCounts.groups}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Timetables</div>
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{entityCounts.timetables}</div>
          </div>
        </div>
      </div>

      {/* Timetable Status Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Timetable Status</h2>
        <div className="flex flex-wrap gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Draft</div>
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{statusOverview.draft}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Generating</div>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{statusOverview.generating}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Generated</div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{statusOverview.generated}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Published</div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{statusOverview.published}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex-1 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Archived</div>
              <Archive className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{statusOverview.archived}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Timetables</h2>
          <Link href="/admin/timetables">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {recentTimetables.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No timetables created yet
            </div>
          ) : (
            <div className="divide-y">
              {recentTimetables.map((timetable) => (
                <div key={timetable.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{timetable.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          timetable.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          timetable.status === 'GENERATED' ? 'bg-blue-100 text-blue-800' :
                          timetable.status === 'GENERATING' ? 'bg-yellow-100 text-yellow-800' :
                          timetable.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {timetable.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {timetable.semester} {timetable.academicYear} • {timetable.assignmentCount} assignments
                        {timetable.fitnessScore && ` • Fitness: ${timetable.fitnessScore.toFixed(2)}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created {new Date(timetable.createdAt).toLocaleDateString()}
                        {timetable.publishedAt && ` • Published ${new Date(timetable.publishedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Link href={`/admin/timetables/${timetable.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
          <Link href="/admin/analytics">
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/courses">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Courses</h3>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">
                Manage course catalog and curriculum
              </p>
            </div>
          </Link>

          <Link href="/admin/instructors">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Instructors</h3>
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                Manage faculty and instructors
              </p>
            </div>
          </Link>

          <Link href="/admin/rooms">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Rooms</h3>
                <Building className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">
                Manage classrooms and facilities
              </p>
            </div>
          </Link>

          <Link href="/admin/students">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Students</h3>
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <p className="text-sm text-gray-600">
                Manage individual students
              </p>
            </div>
          </Link>

          <Link href="/admin/groups">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Student Groups</h3>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="text-sm text-gray-600">
                Manage student groups and programs
              </p>
            </div>
          </Link>

          <Link href="/admin/constraints">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Constraints</h3>
                <Settings className="h-8 w-8 text-amber-600" />
              </div>
              <p className="text-sm text-gray-600">
                Configure scheduling constraints
              </p>
            </div>
          </Link>

          <Link href="/admin/timetables/generate">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Generate Timetable</h3>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">
                Create a new optimized timetable
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
