// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/app/providers";

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useUserRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Update the role context immediately
      setRole(data.user.role === "admin" ? "admin" : "user");

      // Redirect to appropriate dashboard
      if (data.user.role === "admin") {
        router.push("/admin/products-management");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" bg-dark flex items-center justify-center px-8 w-full">
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
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome Back</h1>
          <p className="text-secondary">Sign in to your account to continue</p>
        </div>

        {/* Demo Credentials */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-blue-300 text-xs font-semibold mb-2">
            Demo Credentials:
          </p>
          <div className="text-xs text-blue-200 space-y-1">
            <p>Admin: admin@gmail.com / admin123</p>
            <p>User: user@gmail.com / user</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="bg-stone-900/30 border-white/10 text-primary placeholder:text-secondary/50"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded bg-stone-900/30 border-white/10"
              />
              <span className="text-secondary hover:text-primary transition">
                Remember me
              </span>
            </label>
            <Link
              href="#"
              className="text-secondary hover:text-primary transition"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-black hover:bg-gray-200 font-semibold h-10 rounded-sm"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-secondary">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline font-semibold"
            >
              Sign up
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
