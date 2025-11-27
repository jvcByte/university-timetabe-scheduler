import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Zap, Users, Settings } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Quick Start | Documentation",
  description: "Get up and running quickly with the University Timetable Scheduler",
};

export default function QuickStartPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <Link href="/docs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Button>
        </Link>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-4">Quick Start Guide</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Get up and running with the University Timetable Scheduler in minutes.
        </p>

        {/* Step 1 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
                1
              </div>
              <div>
                <CardTitle>Login to the System</CardTitle>
                <CardDescription>Access your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Navigate to the login page and enter your credentials:</p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-mono text-sm">
                <strong>Admin:</strong> admin@university.edu / admin123
              </p>
              <p className="font-mono text-sm">
                <strong>Faculty:</strong> john.smith@university.edu / faculty123
              </p>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ Change your password after first login!
            </p>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
                2
              </div>
              <div>
                <CardTitle>Set Up Academic Data</CardTitle>
                <CardDescription>Add courses, instructors, rooms, and groups</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Option A: Import Data (Recommended)</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Navigate to Admin → Courses (or Instructors, Rooms, Groups)</li>
                <li>Click &quot;Import&quot; button</li>
                <li>Upload your CSV or Excel file</li>
                <li>Review preview and click &quot;Import Data&quot;</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Option B: Manual Entry</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Navigate to the entity page (Courses, Instructors, etc.)</li>
                <li>Click &quot;New&quot; button</li>
                <li>Fill in the form</li>
                <li>Click &quot;Create&quot;</li>
              </ol>
            </div>
            <Link href="/docs/user-guide#importing-data">
              <Button variant="link" className="p-0 h-auto">
                View CSV format requirements →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
                3
              </div>
              <div>
                <CardTitle>Configure Instructor Availability</CardTitle>
                <CardDescription>Set when instructors can teach</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>Navigate to Admin → Instructors</li>
              <li>Click Edit on an instructor</li>
              <li>Go to &quot;Availability&quot; tab</li>
              <li>For each day, add time ranges (e.g., 09:00-12:00, 14:00-17:00)</li>
              <li>Optionally set preferences (preferred days/times)</li>
              <li>Save changes</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              💡 Tip: Preferences are soft constraints - the system will try to honor them but may violate if necessary.
            </p>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
                4
              </div>
              <div>
                <CardTitle>Assign Courses</CardTitle>
                <CardDescription>Link courses to instructors and groups</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>Navigate to Admin → Courses</li>
              <li>Click Edit on a course</li>
              <li>In &quot;Instructors&quot; section, select one or more instructors</li>
              <li>In &quot;Student Groups&quot; section, select groups</li>
              <li>Save changes</li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 5 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 font-bold">
                5
              </div>
              <div>
                <CardTitle>Generate Your First Timetable</CardTitle>
                <CardDescription>Let the system create an optimized schedule</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>Navigate to Admin → Timetables</li>
              <li>Click &quot;Generate New Timetable&quot;</li>
              <li>Fill in:
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li>Name (e.g., &quot;Fall 2024 Schedule&quot;)</li>
                  <li>Semester (e.g., &quot;Fall 2024&quot;)</li>
                  <li>Academic Year (e.g., &quot;2024-2025&quot;)</li>
                </ul>
              </li>
              <li>Keep &quot;Use Fast Local Solver&quot; enabled (recommended)</li>
              <li>Click &quot;Generate&quot;</li>
              <li>Wait 10-60 seconds for results</li>
            </ol>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <strong>Expected Results:</strong>
              </p>
              <ul className="text-sm space-y-1 mt-2">
                <li>✅ Success: Fitness score 0-100 (lower is better)</li>
                <li>✅ All courses assigned to time slots</li>
                <li>✅ No hard constraint violations</li>
                <li>⚠️ Some soft constraint violations may occur</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Step 6 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 font-bold">
                6
              </div>
              <div>
                <CardTitle>Review and Publish</CardTitle>
                <CardDescription>Check the schedule and make it available</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>Review the generated timetable in calendar view</li>
              <li>Use filters to check specific rooms, instructors, or groups</li>
              <li>If needed, enter Edit Mode to manually adjust assignments</li>
              <li>Once satisfied, click &quot;Publish&quot;</li>
              <li>Timetable is now visible to faculty and students</li>
            </ol>
          </CardContent>
        </Card>

        {/* Common Workflows */}
        <h2 className="text-3xl font-semibold mt-12 mb-6">Common Workflows</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Quick Timetable Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm space-y-2">
                <li>1. Import data (CSV/Excel)</li>
                <li>2. Set instructor availability</li>
                <li>3. Generate timetable</li>
                <li>4. Publish</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3">
                ⏱️ Time: 10-15 minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Manual Schedule Adjustment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm space-y-2">
                <li>1. Open timetable</li>
                <li>2. Enter Edit Mode</li>
                <li>3. Drag assignments to new slots</li>
                <li>4. System validates changes</li>
                <li>5. Save</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3">
                ⏱️ Time: 5-10 minutes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips and Tricks */}
        <h2 className="text-3xl font-semibold mt-12 mb-6">Tips and Tricks</h2>

        <div className="space-y-4 mb-8">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ Best Practices
            </p>
            <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
              <li>• Set realistic instructor availability (not too restrictive)</li>
              <li>• Ensure enough rooms for all courses</li>
              <li>• Use the local solver for faster results</li>
              <li>• Review violations panel after generation</li>
              <li>• Export timetables regularly as backup</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
              ⚠️ Common Pitfalls
            </p>
            <ul className="text-sm space-y-1 text-amber-700 dark:text-amber-300">
              <li>• Not setting instructor availability (causes infeasibility)</li>
              <li>• Insufficient room capacity for large groups</li>
              <li>• Too many courses for available time slots</li>
              <li>• Forgetting to assign instructors to courses</li>
              <li>• Not configuring constraint weights</li>
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <h2 className="text-3xl font-semibold mt-12 mb-6">Next Steps</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/docs/user-guide">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Read Full User Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Comprehensive guide covering all features and workflows
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/docs/solver-algorithm">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Zap className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Learn About Algorithms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Understand how the optimization algorithms work
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/timetables">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Start Using the System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Jump right in and create your first timetable
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
