// middleware.ts (at root of your project, same level as app/)
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authToken = request.cookies.get("auth-token")?.value;
  const userRole = request.cookies.get("user-role")?.value;

  // Public routes - accessible without login
  const publicRoutes = ["/", "/login", "/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Admin routes - only for admin users
  const adminRoutes = ["/admin"];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Protected routes - only for logged-in users
  const protectedRoutes = ["/dashboard", "/products", "/history", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If no auth token
  if (!authToken) {
    // Allow public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect to login for protected/admin routes
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is logged in
  if (authToken) {
    // Redirect from login/signup to appropriate dashboard
    if (pathname === "/login" || pathname === "/signup") {
      if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Admin routes - only admins allowed
    if (isAdminRoute) {
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // Protected routes - users allowed
    if (isProtectedRoute) {
      if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};