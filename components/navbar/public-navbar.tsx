// components/navbar/public-navbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { scrollToFooter } from "@/lib/scroll-utils";

export function PublicNavbar() {
  return (
    <nav className="fixed top-0 w-full border-b border-white/10 bg-black z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className=" flex items-center gap-x-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-400 flex items-center justify-center rounded-sm">
              <span className="text-black font-bold text-xs">▲</span>
            </div>
            <span className="font-medium text-base tracking-wide">TokoRF</span>
          </Link>

          <span className=" text-2xl font-extralight text-stone-700">/</span>

          <div className="hidden lg:flex items-center gap-12 text-sm">
            <a
              href="/"
              className="text-[#a1a1a1] hover:text-[#ededed] transition"
            >
              Home
            </a>
            <a
              href="/#products"
              className="text-[#a1a1a1] hover:text-[#ededed] transition"
            >
              Product List
            </a>
            <button
              onClick={scrollToFooter}
              className="text-[#a1a1a1] hover:text-[#ededed] transition cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button
              variant="outline"
              className="border-2 border-border-2 bg-transparent text-primary hover:bg-white/10 text-sm font-medium rounded-sm leading-0 pt-3.5 pb-4 h-fit"
            >
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary text-black hover:bg-gray-200  text-sm font-medium rounded-sm roun leading-0 pt-3.5 pb-4 h-fit">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
