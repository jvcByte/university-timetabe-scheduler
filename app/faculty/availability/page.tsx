import { requireFaculty } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AvailabilityForm } from "@/components/availability-form";

export default async function FacultyAvailabilityPage() {
  const session = await requireFaculty();

  // Get the instructor record for this user
  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    include: {
      department: true,
    },
  });

  if (!instructor) {
    redirect("/faculty");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Manage Availability</h1>
        <p className="text-gray-600">
          Set your weekly availability and preferred teaching times. This information
          will be used when generating timetables.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Instructor Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>{" "}
              <span className="font-medium">{instructor.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Department:</span>{" "}
              <span className="font-medium">{instructor.department.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Teaching Load:</span>{" "}
              <span className="font-medium">{instructor.teachingLoad} hours/week</span>
            </div>
          </div>
        </div>

        <AvailabilityForm
          instructorId={instructor.id}
          availability={instructor.availability as Record<string, string[]>}
          preferences={instructor.preferences as { preferredDays?: string[]; preferredTimes?: string[] } | undefined}
        />
      </div>
    </div>
  );
}
