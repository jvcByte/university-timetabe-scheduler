import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isAuthRoute = nextUrl.pathname.startsWith("/login") || 
                      nextUrl.pathname.startsWith("/register");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isFacultyRoute = nextUrl.pathname.startsWith("/faculty");
  const isStudentRoute = nextUrl.pathname.startsWith("/student");
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  // Allow auth routes and API auth routes
  if (isAuthRoute || nextUrl.pathname.startsWith("/api/auth")) {
    if (isLoggedIn && isAuthRoute) {
      // Redirect logged-in users away from auth pages
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Protect all other routes - require authentication
  if (!isLoggedIn && !isApiRoute) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  if (isLoggedIn) {
    // Admin routes - only ADMIN role
    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // Faculty routes - only FACULTY role
    if (isFacultyRoute && userRole !== "FACULTY") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // Student routes - only STUDENT role
    if (isStudentRoute && userRole !== "STUDENT") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
