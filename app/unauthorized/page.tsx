import Link from "next/link";
import { auth } from "@/auth";

export default async function UnauthorizedPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">403 - Unauthorized</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to access this page.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Current role: {session?.user?.role || "Not logged in"}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
