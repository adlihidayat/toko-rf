// lib/get-user-role.ts
import { cookies } from "next/headers";

export async function getUserRole(): Promise<"user" | "admin" | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return null;

    // Decode token or fetch from DB based on your auth setup
    // This is a placeholder - adjust based on your auth method
    const userRole = cookieStore.get("user-role")?.value;

    return userRole === "admin" ? "admin" : "user";
  } catch (error) {
    return null;
  }
}