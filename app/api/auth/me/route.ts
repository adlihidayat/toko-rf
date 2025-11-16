import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/db/users";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await UserService.findById(token);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber, // NEW
      role: user.role,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}