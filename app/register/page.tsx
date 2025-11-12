import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to get started
          </p>
        </div>

        <div className="bg-white p-8 shadow-md rounded-lg">
          <RegisterForm />

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
