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
        {/* ... keep your existing JSX ... */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... keep your existing form fields ... */}
        </form>
      </div>
    </div>
  );
}
