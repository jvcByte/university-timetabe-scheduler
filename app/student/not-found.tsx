import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { BackButton } from "@/components/back-button";

export default function StudentNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            Student Page Not Found
          </h2>
          <p className="text-gray-600">
            The student page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/student">
            <Button size="lg" className="w-full sm:w-auto">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Student Dashboard
            </Button>
          </Link>
          <BackButton />
        </div>
      </div>
    </div>
  );
}
