import { Metadata } from "next";
import { BookOpen, FileText, Code, Layers, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Documentation | University Timetable Scheduler",
  description: "Complete documentation for the University Timetable Scheduler system",
};

const documentationSections = [
  {
    title: "User Guide",
    description: "Complete guide for administrators, faculty, and students",
    icon: Users,
    href: "/docs/user-guide",
    badge: "Essential",
    color: "text-blue-600",
    topics: [
      "Getting started and login",
      "Administrator tasks",
      "Faculty availability management",
      "Student schedule viewing",
      "Troubleshooting",
    ],
  },
  {
    title: "Solver Algorithm",
    description: "Deep dive into the optimization algorithms",
    icon: Zap,
    href: "/docs/solver-algorithm",
    badge: "Technical",
    color: "text-purple-600",
    topics: [
      "Simulated Annealing (Local Solver)",
      "Constraint Programming (OR-Tools)",
      "Algorithm comparison",
      "Performance characteristics",
      "Constraint handling",
    ],
  },
  {
    title: "Architecture",
    description: "System design and architecture patterns",
    icon: Layers,
    href: "/docs/architecture",
    badge: "Technical",
    color: "text-green-600",
    topics: [
      "System overview",
      "Component architecture",
      "Data flow diagrams",
      "Security architecture",
      "Scalability considerations",
    ],
  },
  {
    title: "API Documentation",
    description: "REST API reference for solver service",
    icon: Code,
    href: "/docs/api",
    badge: "Developer",
    color: "text-orange-600",
    topics: [
      "Solver service endpoints",
      "Request/response formats",
      "Authentication",
      "Error handling",
      "Best practices",
    ],
  },
  {
    title: "Quick Start",
    description: "Get up and running quickly",
    icon: BookOpen,
    href: "/docs/quick-start",
    badge: "Beginner",
    color: "text-teal-600",
    topics: [
      "Installation guide",
      "First-time setup",
      "Creating your first timetable",
      "Common workflows",
      "Tips and tricks",
    ],
  },
  {
    title: "Documentation Index",
    description: "Browse all documentation by topic",
    icon: FileText,
    href: "/docs/index",
    badge: "Reference",
    color: "text-gray-600",
    topics: [
      "Documentation by role",
      "Documentation by topic",
      "FAQs",
      "Support information",
      "Contributing",
    ],
  },
];

export default function DocumentationPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about the University Timetable Scheduler
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Quick Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium mb-2 text-sm text-muted-foreground">For Users</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/docs/user-guide#getting-started" className="text-blue-600 hover:underline">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/docs/user-guide#administrator-guide" className="text-blue-600 hover:underline">
                  Admin Guide
                </Link>
              </li>
              <li>
                <Link href="/docs/user-guide#faculty-guide" className="text-blue-600 hover:underline">
                  Faculty Guide
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-sm text-muted-foreground">For Developers</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/docs/architecture" className="text-blue-600 hover:underline">
                  Architecture Overview
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="text-blue-600 hover:underline">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs/solver-algorithm" className="text-blue-600 hover:underline">
                  Algorithm Details
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-sm text-muted-foreground">Common Tasks</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/docs/user-guide#generating-timetables" className="text-blue-600 hover:underline">
                  Generate Timetable
                </Link>
              </li>
              <li>
                <Link href="/docs/user-guide#importing-data" className="text-blue-600 hover:underline">
                  Import Data
                </Link>
              </li>
              <li>
                <Link href="/docs/user-guide#troubleshooting" className="text-blue-600 hover:underline">
                  Troubleshooting
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentationSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Icon className={`h-8 w-8 ${section.color}`} />
                    <Badge variant="secondary">{section.badge}</Badge>
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {section.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Additional Resources */}
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
        <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">External Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/google/or-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Google OR-Tools Documentation
                  <span className="text-xs">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Next.js Documentation
                  <span className="text-xs">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.prisma.io/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Prisma Documentation
                  <span className="text-xs">↗</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium">Email:</span>{" "}
                <a href="mailto:support@university.edu" className="text-blue-600 hover:underline">
                  support@university.edu
                </a>
              </li>
              <li>
                <span className="font-medium">Hours:</span> Monday-Friday, 9:00 AM - 5:00 PM
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Documentation Version 1.0.0 • Last Updated: November 26, 2025</p>
      </div>
    </div>
  );
}
