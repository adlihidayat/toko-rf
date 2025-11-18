// middleware.ts (SIMPLIFIED & FIXED)
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get auth token (this is our single source of truth in middleware)
  const authToken = request.cookies.get("auth-token")?.value;
  const userRole = request.cookies.get("user-role")?.value;

  // Define route patterns
  const authRoutes = ["/login", "/signup"];
  const adminRoutes = ["/admin"];
  const protectedRoutes = ["/profile", "/history"];

  // Check if current path matches any pattern
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // ============================================
  // 1. If NOT logged in
  // ============================================
  if (!authToken) {
    // Block admin and protected routes
    if (isAdminRoute || isProtectedRoute) {
      console.log(`🚫 Blocking ${pathname} - no auth token`);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Allow everything else (public routes, auth routes)
    return NextResponse.next();
  }

  // ============================================
  // 2. If logged in
  // ============================================

  // Redirect away from login/signup
  if (isAuthRoute) {
    const redirectUrl =
      userRole === "admin" ? "/admin/products-management" : "/";
    console.log(`📤 Redirecting from ${pathname} to ${redirectUrl}`);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Check admin routes
  if (isAdminRoute && userRole !== "admin") {
    console.log(`🚫 Non-admin blocked from ${pathname}`);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow everything else
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};