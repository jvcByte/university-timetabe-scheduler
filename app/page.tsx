import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default async function Home() {
  const session = await auth();

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
    <main className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative backdrop-blur-sm bg-white/80 border-b border-gray-200/40 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TimeTable Scheduler
              </h1>
              <p className="text-xs text-gray-600 font-medium">Smart Academic Planning</p>
            </div>
          </div>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold shadow-md">
          <Sparkles className="h-4 w-4" /> Powered by Greedy + Simulated Annealing Algorithm
        </div>
          <h2 className="!text-5xl md:!text-6xl !font-extrabold !text-gray-900 !leading-tight">
            Automated University Timetable Scheduling
          </h2>

          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Transform your academic scheduling with intelligent automation.
            <span className="font-semibold text-gray-800"> Save time, eliminate conflicts,</span> and optimize resources.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button
                size="lg"
                className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="px-8 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 shadow-md transition-all hover:scale-105"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
            {[
              { value: "99%", label: "Conflict Free" },
              { value: "10x", label: "Faster Scheduling" },
              { value: "24/7", label: "Automated" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center space-y-1">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-white">TimeTable Scheduler</span>
          </div>
          <p className="text-sm">&copy; 2025 University Timetable Scheduler. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
