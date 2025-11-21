// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/app/providers";

export default function SignupPage() {
  const router = useRouter();
  const { refreshAuth } = useUserRole();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneNumberChange = (value: string) => {
    let formattedPhone = value;
    formattedPhone = formattedPhone.replace(/[^\d+]/g, "");

    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+62" + formattedPhone.substring(1);
    }

    if (
      formattedPhone &&
      !formattedPhone.startsWith("+62") &&
      !formattedPhone.startsWith("+")
    ) {
      formattedPhone = "+62" + formattedPhone;
    }

    setFormData((prev) => ({ ...prev, phoneNumber: formattedPhone }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.phoneNumber.startsWith("+62")) {
      setError("Phone number must start with +62");
      setIsLoading(false);
      return;
    }

    if (formData.phoneNumber.length < 12) {
      setError("Phone number must be at least 10 digits after +62");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // IMPORTANT: Refresh auth state
      await refreshAuth();

      // Navigate with delay to ensure state update
      setTimeout(() => {
        router.push("/products");
        router.refresh();
      }, 100);
    } catch (err) {
      setError("Signup failed. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-dark flex items-center justify-center px-8 w-full py-12">
      <div className="w-full max-w-md h-fit">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="w-6 h-6 bg-green-400 flex items-center justify-center rounded-sm">
              <span className="text-black font-bold text-xs">▲</span>
            </div>
            <span className="font-medium text-base tracking-wide text-primary">
              TokoRF
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Create Account
          </h1>
          <p className="text-secondary">Sign up to get started</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-primary">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              disabled={isLoading}
              className="bg-stone-900/30 border-white/10 text-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              disabled={isLoading}
              className="bg-stone-900/30 border-white/10 text-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-primary">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+62 812 345 6789"
              value={formData.phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              disabled={isLoading}
              className="bg-stone-900/30 border-white/10 text-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-primary">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              disabled={isLoading}
              className="bg-stone-900/30 border-white/10 text-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-primary">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              disabled={isLoading}
              className="bg-stone-900/30 border-white/10 text-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-black hover:bg-gray-200 font-semibold h-10 rounded-sm mt-6"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-secondary hover:text-primary transition text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
