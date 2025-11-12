import { requireFaculty } from "@/lib/auth-utils";

export default async function FacultyDashboard() {
  const session = await requireFaculty();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Faculty Dashboard</h1>
      <p className="text-gray-600 mb-4">
        Welcome, {session.user.name}!
      </p>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-sm text-gray-500">
          This is the faculty dashboard. Schedule viewing and availability management features will be implemented in subsequent tasks.
        </p>
      </div>
    </div>
  );
}
