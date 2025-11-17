// components/home/ready-to-start.tsx
"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CustomButton } from "../ui/custom-button";
import { useUserRole } from "@/app/providers";

export function ReadyToStart() {
  const { role } = useUserRole();
  const isLoggedIn = role === "user" || role === "admin";
  const router = useRouter();

  const handleBrowseMore = useCallback(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    router.push("/products");
  }, [isLoggedIn, router]);

  const handleAccountAction = useCallback(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    router.push("/profile");
  }, [isLoggedIn, router]);

  return (
    <section className="py-20 px-8 mt-20">
      <div className="max-w-6xl mx-auto flex items-center flex-col">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6 relative">
            <div className="h-36 bg-linear-to-b from-[#FC903B]/10 to-[#FC903B] w-px absolute bottom-0 z-0"></div>
            <span className="px-3.5 py-1.5 bg-linear-to-r to-[#FABC2D] from-[#FF6349] rounded-full text-background z-10 font-bold">
              4
            </span>
          </div>
          <div className="mb-4">
            <span className="text-2xl font-semibold text-primary">
              Ready to get your code?
            </span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold tracking-tight text-center mb-4 text-primary">
            Be part of over 14,385 satisfied customers. Obtain immediate access
            now
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row  justify-center gap-x-2 gap-y-3 w-40">
          <CustomButton
            variant="black"
            onClick={handleBrowseMore}
            className="md:w-48"
          >
            Browse More Packages
          </CustomButton>
          <CustomButton variant="white" onClick={handleAccountAction}>
            {isLoggedIn ? "See Profile" : "Login to account"}
          </CustomButton>
        </div>
      </div>
    </section>
  );
}
