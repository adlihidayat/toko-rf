// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user by ID
    const user = await User.findById(authToken).select("-password");

    if (!user) {
      // User not found - clear invalid cookies
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );

      // Clear all auth cookies
      response.cookies.set("auth-token", "", { maxAge: 0 });
      response.cookies.set("user-id", "", { maxAge: 0 });
      response.cookies.set("user-role", "", { maxAge: 0 });
      response.cookies.set("user-username", "", { maxAge: 0 });
      response.cookies.set("user-email", "", { maxAge: 0 });
      response.cookies.set("user-phone", "", { maxAge: 0 });

      return response;
    }

    // Return user data
    return NextResponse.json({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      joinDate: user.joinDate,
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}