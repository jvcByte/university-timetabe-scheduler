import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookies
  const sessionToken = request.cookies.get("authjs.session-token")?.value ||
                       request.cookies.get("__Secure-authjs.session-token")?.value;
  
  const isLoggedIn = !!sessionToken;

  // Public routes
  if (pathname === "/" || pathname.startsWith("/docs")) {
    return NextResponse.next();
  }

  // Auth routes
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    // Redirect logged-in users to their dashboard
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/api/auth/redirect", request.url));
    }
    return NextResponse.next();
  }

  // API routes (allow all, let API handle auth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Protected routes - require login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For role-based access, we'll handle it in the page components
  // since we can't access the database in Edge middleware efficiently
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
