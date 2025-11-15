import { requireAdmin } from "@/lib/auth-utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <DashboardHeader
        userName={session.user.name || "Admin"}
        userRole="ADMIN"
        userEmail={session.user.email || undefined}
      />
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
