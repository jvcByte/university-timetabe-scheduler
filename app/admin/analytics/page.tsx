import { requireAdmin } from "@/lib/auth-utils";
import { 
  getRoomUtilization, 
  getInstructorLoadDistribution,
  getRecentTimetables 
} from "@/lib/dashboard";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp,
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RoomUtilizationChart from "@/components/room-utilization-chart";
import InstructorLoadChart from "@/components/instructor-load-chart";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function AnalyticsPage() {
  await requireAdmin();

  // Get recent timetables for selection
  const recentTimetables = await getRecentTimetables(10);
  
  // Get analytics data (for all timetables by default)
  const roomUtilization = await getRoomUtilization();
  const instructorLoad = await getInstructorLoadDistribution();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-gray-900">Analytics</h1>
      <p className="text-gray-600 mb-8">
        View system analytics and performance metrics
      </p>

      {/* Room Utilization Chart */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Room Utilization
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Percentage of time slots used per room
              </p>
            </div>
          </div>
          <RoomUtilizationChart data={roomUtilization} />
        </div>
      </div>

      {/* Instructor Load Distribution Chart */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Instructor Teaching Load
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Teaching hours assigned vs. maximum load
              </p>
            </div>
          </div>
          <InstructorLoadChart data={instructorLoad} />
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Average Room Utilization</div>
          <div className="text-3xl font-bold text-purple-600">
            {roomUtilization.length > 0
              ? (roomUtilization.reduce((sum, r) => sum + r.utilizationRate, 0) / roomUtilization.length).toFixed(1)
              : 0}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Average Instructor Load</div>
          <div className="text-3xl font-bold text-green-600">
            {instructorLoad.length > 0
              ? (instructorLoad.reduce((sum, i) => sum + i.loadPercentage, 0) / instructorLoad.length).toFixed(1)
              : 0}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Overloaded Instructors</div>
          <div className="text-3xl font-bold text-orange-600">
            {instructorLoad.filter(i => i.loadPercentage > 100).length}
          </div>
        </div>
      </div>
    </div>
  );
}
