import { requireAdmin } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Building, Calendar, Settings } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome, {session.user.name}!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="bg-white p-6 rounded-lg shadow-md opacity-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Timetables</h3>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600">
            Generate and manage timetables
          </p>
          <p className="text-xs text-gray-400 mt-2">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
