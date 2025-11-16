// components/navbar/navbar.tsx
"use client";

import { useUserRole } from "@/app/providers";
import { PublicNavbar } from "./public-navbar";
import { UserNavbar } from "./user-navbar";
import { AdminNavbar } from "./admin-navbar";

export function Navbar() {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return null; // or a loading skeleton
  }

  if (role === "admin") {
    return <AdminNavbar />;
  }

  if (role === "user") {
    return <UserNavbar />;
  }

  return <PublicNavbar />;
}
