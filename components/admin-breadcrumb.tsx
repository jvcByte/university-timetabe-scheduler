"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

export function AdminBreadcrumb() {
  const pathname = usePathname();
  
  // Don't show breadcrumb on the main admin page
  if (pathname === "/admin") {
    return null;
  }

  // Parse the pathname into segments
  const segments = pathname.split("/").filter(Boolean);
  
  // Remove 'admin' from segments as it's the base
  const pathSegments = segments.slice(1);

  // Generate breadcrumb items
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/admin/${pathSegments.slice(0, index + 1).join("/")}`;
    
    // Format the segment name
    let label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    // Handle special cases
    if (segment === "new") label = "New";
    if (segment === "edit") label = "Edit";
    if (segment === "generate") label = "Generate";
    if (!isNaN(Number(segment))) label = `#${segment}`;
    
    return {
      label,
      href,
      isLast: index === pathSegments.length - 1,
    };
  });

  return (
    <nav className="flex items-center space-x-1 text-sm mb-6 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
      <Link
        href="/admin"
        className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((crumb) => (
        <Fragment key={crumb.href}>
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          {crumb.isLast ? (
            <span className="font-semibold text-gray-900 px-2 py-1">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="px-2 py-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
