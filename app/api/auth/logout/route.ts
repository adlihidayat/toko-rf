// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logout successful" },
      { status: 200 }
    );

    // Clear all auth cookies with proper settings
    const cookieOptions = {
      maxAge: 0,
      path: "/",
      httpOnly: false,
    };

    response.cookies.set("auth-token", "", { ...cookieOptions, httpOnly: true });
    response.cookies.set("user-id", "", cookieOptions);
    response.cookies.set("user-role", "", cookieOptions);
    response.cookies.set("user-username", "", cookieOptions);
    response.cookies.set("user-email", "", cookieOptions);
    response.cookies.set("user-phone", "", cookieOptions);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
