import { auth } from "@/auth";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">
          University Timetable Scheduler
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Automated lecture timetable scheduling system
        </p>

        {session?.user && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <p className="text-sm text-gray-600 mb-2">Logged in as:</p>
            <p className="font-semibold text-lg">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
            <p className="text-sm text-blue-600 mt-2">
              Role: {session.user.role}
            </p>

            <div className="mt-6 flex gap-4 justify-center">
              {session.user.role === "ADMIN" && (
                <Link href="/admin">
                  <Button>Admin Dashboard</Button>
                </Link>
              )}
              {session.user.role === "FACULTY" && (
                <Link href="/faculty">
                  <Button>Faculty Dashboard</Button>
                </Link>
              )}
              {session.user.role === "STUDENT" && (
                <Link href="/student">
                  <Button>Student Dashboard</Button>
                </Link>
              )}

              <form action={logout}>
                <Button type="submit" variant="outline">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
