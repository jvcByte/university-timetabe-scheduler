import { requireAdmin } from "@/lib/auth-utils";
import { getRoomById } from "@/lib/rooms";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RoomDetailPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const room = await getRoomById(Number(id));

  if (!room) {
    notFound();
  }

  const formatEquipment = (equipment: any): string[] => {
    if (!equipment) return [];
    if (Array.isArray(equipment)) return equipment;
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/admin/rooms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Rooms
            </Button>
          </Link>
          <Link href={`/admin/rooms/${room.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Room
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-gray-600 mt-1">{room.building}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Room Type</h3>
                <p className="text-lg">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {room.type.replace(/_/g, " ")}
                  </span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Capacity</h3>
                <p className="text-lg font-semibold">{room.capacity} students</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Equipment</h3>
              {formatEquipment(room.equipment).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formatEquipment(room.equipment).map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {item.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No equipment listed</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {room._count.assignments}
                  </p>
                </div>
              </div>
            </div>

            {room.assignments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Recent Assignments
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Course
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Instructor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Day
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Timetable
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {room.assignments.slice(0, 10).map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-4 py-3 text-sm">
                            {assignment.course.code}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {assignment.instructor.name}
                          </td>
                          <td className="px-4 py-3 text-sm">{assignment.day}</td>
                          <td className="px-4 py-3 text-sm">
                            {assignment.startTime} - {assignment.endTime}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {assignment.timetable.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-4 border-t text-sm text-gray-500">
              <p>Created: {new Date(room.createdAt).toLocaleDateString()}</p>
              <p>Last updated: {new Date(room.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
