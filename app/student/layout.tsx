import { requireStudent } from "@/lib/auth-utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { StudentSidebar } from "@/components/student-sidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStudent();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <DashboardHeader
        userName={session.user.name || "Student"}
        userRole="STUDENT"
        userEmail={session.user.email || undefined}
      />
      <div className="flex-1 flex overflow-hidden">
        <StudentSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
