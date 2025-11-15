// components/navbar/admin-navbar.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AdminNavbar() {
  return (
    <nav className="fixed top-0 w-full border-b border-white/10 bg-black z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-5 h-5 bg-white flex items-center justify-center rounded-sm">
            <span className="text-black font-bold text-xs">▲</span>
          </div>
          <span className="font-medium text-sm tracking-wide">ADMIN</span>
        </Link>

        <div className="hidden lg:flex items-center gap-12 text-sm">
          <Link
            href="/admin/dashboard"
            className="text-gray-500 hover:text-white transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="text-gray-500 hover:text-white transition"
          >
            Products
          </Link>
          <Link
            href="/admin/transactions"
            className="text-gray-500 hover:text-white transition"
          >
            Transactions
          </Link>
          <Link
            href="/admin/users"
            className="text-gray-500 hover:text-white transition"
          >
            Users
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/api/auth/logout">
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent h-9 text-sm font-medium"
            >
              Logout
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
