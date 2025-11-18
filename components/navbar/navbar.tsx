// components/navbar/navbar.tsx
"use client";

import { useUserRole } from "@/app/providers";
import { PublicNavbar } from "./public-navbar";
import { UserNavbar } from "./user-navbar";
import { AdminNavbar } from "./admin-navbar";

export function Navbar() {
  const { role, isLoading } = useUserRole();

  // Show loading state briefly
  if (isLoading) {
    return (
      <nav className="border-b border-white/10 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center">
          <div className="text-secondary text-sm">Loading...</div>
        </div>
      </nav>
    );
  }

  if (role === "admin") {
    return <AdminNavbar />;
  }

  if (role === "user") {
    return <UserNavbar />;
  }

  return <PublicNavbar />;
}
