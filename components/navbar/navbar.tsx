// components/navbar/navbar.tsx
import { getUserRole } from "@/lib/get-user-role";
import { PublicNavbar } from "./public-navbar";
import { UserNavbar } from "./user-navbar";
import { AdminNavbar } from "./admin-navbar";

export async function Navbar() {
  const role = await getUserRole();

  if (role === "admin") {
    return <AdminNavbar />;
  }

  if (role === "user") {
    return <UserNavbar />;
  }

  return <PublicNavbar />;
}
