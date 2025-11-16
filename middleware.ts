// middleware.ts (at root of your project, same level as app/)
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Check for user-id instead of auth-token since that's what your login sets
  const userId = request.cookies.get("user-id")?.value;
  const userRole = request.cookies.get("user-role")?.value;
  const authToken = userId; // Use userId as auth check

  // Log for debugging
  console.log("🔍 Middleware Check:", {
    pathname,
    hasAuthToken: !!authToken,
    userRole,
    timestamp: new Date().toISOString(),
  });

  // Define route types
  const adminRoutes = ["/admin"];
  const protectedRoutes = ["/history", "/profile"]; // Removed /products-management since it doesn't exist
  const authRoutes = ["/login", "/signup"];
  const publicRoutes = ["/", "/products", "/checkout"]; // Explicitly allow checkout

  // Check route types (order matters!)
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

  console.log("📍 Route Type:", {
    isPublicRoute,
    isProtectedRoute,
    isAdminRoute,
    isAuthRoute
  });

  // ============================================
  // SCENARIO 1: No auth token (not logged in)
  // ============================================
  if (!authToken) {
    console.log("❌ No Auth Token");

    // Allow public routes and auth routes
    if (isPublicRoute || isAuthRoute) {
      console.log("✅ Public/Auth route - allowing access");
      return NextResponse.next();
    }

    // Redirect to login for protected/admin routes
    console.log("🚫 Protected route without auth - redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ============================================
  // SCENARIO 2: User is logged in
  // ============================================
  console.log("✅ Auth Token Present");

  // Redirect from login/signup to appropriate page
  if (isAuthRoute) {
    const redirectUrl = userRole === "admin" ? "/admin/products-management" : "/profile";
    console.log(`📤 Logged in user on auth page - redirecting to ${redirectUrl}`);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Admin routes - only admins allowed
  if (isAdminRoute) {
    if (userRole !== "admin") {
      console.log("❌ Non-admin user accessing admin route - redirecting to /profile");
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    console.log("✅ Admin user - allowing access to admin route");
    return NextResponse.next();
  }

  // Protected routes - users allowed, but redirect admins to admin products-management
  if (isProtectedRoute) {
    if (userRole === "admin") {
      console.log("📤 Admin user on protected user route - redirecting to /admin/products-management");
      return NextResponse.redirect(new URL("/admin/products-management", request.url));
    }
    console.log("✅ User allowed on protected route");
    return NextResponse.next();
  }

  // Public routes - everyone allowed
  console.log("✅ Public route - allowing access");
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