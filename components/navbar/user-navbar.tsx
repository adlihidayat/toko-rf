// components/navbar/user-navbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UserNavbar() {
  const scrollToFooter = () => {
    const footer = document.getElementById("footer");
    footer?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 w-full border-b border-white/10 bg-black z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-5 h-5 bg-white flex items-center justify-center rounded-sm">
            <span className="text-black font-bold text-xs">▲</span>
          </div>
          <span className="font-medium text-sm tracking-wide">STORE</span>
        </Link>

        <div className="hidden lg:flex items-center gap-12 text-sm">
          <Link
            href="/products"
            className="text-[#a1a1a1] hover:text-[#ededed] transition"
          >
            Products
          </Link>
          <Link
            href="/history"
            className="text-[#a1a1a1] hover:text-[#ededed] transition"
          >
            History
          </Link>
          <button
            onClick={scrollToFooter}
            className="text-[#a1a1a1] hover:text-[#ededed] transition cursor-pointer"
          >
            Contact
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="text-[#a1a1a1] hover:text-[#ededed]"
            >
              Dashboard
            </Button>
          </Link>
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
