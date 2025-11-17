// app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/db/services/users";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Validate ID format
    if (!userId || userId.length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await UserService.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const body = await request.json();

    // Validate ID format
    if (!userId || userId.length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists first
    const existingUser = await UserService.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Handle role update (for admin user management pages)
    if (body.role && !body.username && !body.email && !body.phoneNumber) {
      // Validate role value
      if (!["admin", "user"].includes(body.role)) {
        return NextResponse.json(
          { success: false, error: "Invalid role value" },
          { status: 400 }
        );
      }

      // Prevent downgrading the last admin
      if (body.role === "user" && existingUser.role === "admin") {
        const adminCount = await UserService.countAdmins();
        if (adminCount <= 1) {
          return NextResponse.json(
            {
              success: false,
              error: "Cannot demote the last administrator",
            },
            { status: 400 }
          );
        }
      }

      const user = await UserService.updateUserRole(userId, body.role);
      return NextResponse.json({ success: true, data: user });
    }

    // Handle profile update (username, email, phoneNumber)
    if (body.username || body.email || body.phoneNumber) {
      // Validate username
      if (body.username !== undefined) {
        const username = String(body.username).trim();
        if (!username) {
          return NextResponse.json(
            { success: false, error: "Username cannot be empty" },
            { status: 400 }
          );
        }
        if (username.length < 3) {
          return NextResponse.json(
            { success: false, error: "Username must be at least 3 characters" },
            { status: 400 }
          );
        }
      }

      // Validate email
      if (body.email !== undefined) {
        const email = String(body.email).trim().toLowerCase();
        if (!email) {
          return NextResponse.json(
            { success: false, error: "Email cannot be empty" },
            { status: 400 }
          );
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { success: false, error: "Invalid email format" },
            { status: 400 }
          );
        }

        // Check if email is already taken by another user
        if (email !== existingUser.email) {
          const emailExists = await UserService.findByEmail(email);
          if (emailExists) {
            return NextResponse.json(
              { success: false, error: "Email is already in use" },
              { status: 400 }
            );
          }
        }
      }

      // Validate phone number
      if (body.phoneNumber !== undefined) {
        const phoneNumber = String(body.phoneNumber).trim();
        if (!phoneNumber) {
          return NextResponse.json(
            { success: false, error: "Phone number cannot be empty" },
            { status: 400 }
          );
        }
        if (phoneNumber.length < 10) {
          return NextResponse.json(
            { success: false, error: "Phone number must be at least 10 digits" },
            { status: 400 }
          );
        }
      }

      const user = await UserService.updateUserProfile(userId, {
        username: body.username,
        email: body.email,
        phoneNumber: body.phoneNumber,
      });

      return NextResponse.json({ success: true, data: user });
    }

    return NextResponse.json(
      { success: false, error: "No valid fields to update" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error updating user:", error);

    // Handle duplicate email error from MongoDB
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Email is already in use" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Validate ID format
    if (!userId || userId.length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await UserService.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await UserService.countAdmins();
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot delete the last administrator",
          },
          { status: 400 }
        );
      }
    }

    const deleted = await UserService.deleteUser(userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}