// components/navbar/admin-navbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, User } from "lucide-react";
import { useUserRole } from "@/app/providers";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export function AdminNavbar() {
  const router = useRouter();
  const { setRole } = useUserRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setRole(null); // Update context
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
        router.push("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const displayName = userProfile?.username || "admin1";
  const displayEmail = userProfile?.email || "admin@gmail.com";

  return (
    <nav className="fixed top-0 w-full border-b border-white/10 bg-black z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-400 flex items-center justify-center rounded-sm">
              <span className="text-black font-bold text-xs">▲</span>
            </div>
            <span className="font-medium text-base tracking-wide">TokoRF</span>
          </Link>

          <span className="hidden md:block text-2xl font-extralight text-stone-700">
            /
          </span>

          <div className="hidden md:flex items-center gap-12 text-sm">
            <Link
              href="/admin/products-management"
              className="text-[#a1a1a1] hover:text-[#ededed] transition"
            >
              Product Management
            </Link>
            <Link
              href="/admin/users-management"
              className="text-[#a1a1a1] hover:text-[#ededed] transition cursor-pointer"
            >
              User Management
            </Link>
          </div>
        </div>

        {/* Desktop Profile Dropdown */}
        <div className="hidden md:block relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
          >
            <span className="text-[#ededed] text-sm font-medium">
              {isLoadingProfile ? "Loading..." : displayName}
            </span>
            <div className="rounded-full h-6 w-6 bg-stone-400 flex items-center justify-center">
              <User className="w-3 h-3 text-black" />
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-stone-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
              {/* User Info Header */}
              <div className="px-4 py-4 border-b border-white/10">
                <p className="text-sm font-semibold text-[#ededed]">
                  {displayName}
                </p>
                <p className="text-xs text-[#a1a1a1] mt-1">{displayEmail}</p>
              </div>

              {/* Menu Items */}
              <div className="py-0">
                <button
                  onClick={() => {
                    router.push("/admin/profile");
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 pb-4 pt-3 text-sm text-[#ededed] hover:bg-white/10 hover:text-[#52a8ff] transition flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  View Profile
                </button>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 pb-4 pt-3 text-sm text-red-400 hover:bg-white/10 hover:text-red-300 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-[#ededed] hover:text-[#52a8ff] transition"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Full-Screen Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-black/95 z-40">
          <div className="flex flex-col gap-4 p-8">
            {/* Product Management Link */}
            <Link
              href="/admin/products-management"
              onClick={closeMobileMenu}
              className="text-[#ededed] hover:text-[#52a8ff] transition font-medium text-lg border-b border-white/10 pb-4"
            >
              Product Management
            </Link>

            {/* User Management Link */}
            <Link
              href="/admin/users-management"
              onClick={closeMobileMenu}
              className="text-[#ededed] hover:text-[#52a8ff] transition font-medium text-lg border-b border-white/10 pb-4"
            >
              User management
            </Link>

            {/* User Info Section */}
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-sm font-semibold text-[#ededed]">
                {displayName}
              </p>
              <p className="text-xs text-[#a1a1a1] mt-1">{displayEmail}</p>
            </div>

            {/* Show Profile Button */}
            <button
              onClick={() => {
                router.push("/admin/profile");
                setIsMobileMenuOpen(false);
              }}
              className="text-[#ededed] hover:text-[#52a8ff] transition font-medium text-lg border-b border-white/10 pb-4 text-left flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Show Profile
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
