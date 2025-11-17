// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logout successful" },
      { status: 200 }
    );

    // Clear all auth cookies
    response.cookies.set("auth-token", "", { maxAge: 0 });
    response.cookies.set("user-id", "", { maxAge: 0 });
    response.cookies.set("user-role", "", { maxAge: 0 });
    response.cookies.set("user-username", "", { maxAge: 0 });
    response.cookies.set("user-email", "", { maxAge: 0 });
    response.cookies.set("user-phone", "", { maxAge: 0 });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logout successful" },
      { status: 200 }
    );

    // Clear all auth cookies
    response.cookies.set("auth-token", "", { maxAge: 0 });
    response.cookies.set("user-id", "", { maxAge: 0 });
    response.cookies.set("user-role", "", { maxAge: 0 });
    response.cookies.set("user-username", "", { maxAge: 0 });
    response.cookies.set("user-email", "", { maxAge: 0 });
    response.cookies.set("user-phone", "", { maxAge: 0 });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}