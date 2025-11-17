// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/db/services/users";

export async function GET(request: NextRequest) {
  try {
    // Optional: Add auth check here if needed
    const users = await UserService.getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}