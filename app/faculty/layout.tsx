import { requireFaculty } from "@/lib/auth-utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { FacultySidebar } from "@/components/faculty-sidebar";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireFaculty();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <DashboardHeader
        userName={session.user.name || "Faculty"}
        userRole="FACULTY"
        userEmail={session.user.email || undefined}
      />
      <div className="flex-1 flex overflow-hidden">
        <FacultySidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
