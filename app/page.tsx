import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Users, BookOpen, TrendingUp, CheckCircle, Clock } from "lucide-react";

export default async function Home() {
  const session = await auth();

  // Redirect authenticated users to their dashboard
  if (session?.user) {
    switch (session.user.role) {
      case "ADMIN":
        redirect("/admin");
      case "FACULTY":
        redirect("/faculty");
      case "STUDENT":
        redirect("/student");
      default:
        redirect("/");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">TimeTable Scheduler</h1>
            </div>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Automated University Timetable Scheduling
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Optimize your academic scheduling with our intelligent timetable generation system.
            Save time, reduce conflicts, and improve resource utilization.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Intelligent Optimization
            </h4>
            <p className="text-gray-600">
              Advanced algorithms generate optimal timetables while respecting all constraints
              and preferences.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Conflict Resolution
            </h4>
            <p className="text-gray-600">
              Automatically detect and resolve scheduling conflicts for rooms, instructors,
              and student groups.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Multi-Role Access
            </h4>
            <p className="text-gray-600">
              Separate dashboards for administrators, faculty, and students with
              role-specific features.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Course Management
            </h4>
            <p className="text-gray-600">
              Comprehensive course catalog with departments, credits, and duration tracking.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-teal-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-teal-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Visual Schedules
            </h4>
            <p className="text-gray-600">
              Interactive calendar views and detailed schedule listings for easy navigation.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Real-Time Updates
            </h4>
            <p className="text-gray-600">
              Instant schedule updates and notifications when timetables are published.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-blue-600 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to streamline your scheduling?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Sign in to access your personalized dashboard
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Sign In Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 University Timetable Scheduler. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
