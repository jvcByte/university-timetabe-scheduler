import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessMessage({ registered }: { registered?: string }) {
  if (registered === "true") {
    return (
      <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
        Account created successfully! Please sign in.
      </div>
    );
  }
  return null;
}

interface PageProps {
  searchParams: Promise<{ registered?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              University Timetable Scheduler
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>
        </div>

        <div className="bg-white p-8 shadow-md rounded-lg">
          <Suspense fallback={null}>
            <SuccessMessage registered={params.registered} />
          </Suspense>

          <LoginForm />

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
