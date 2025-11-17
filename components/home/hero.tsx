// components/home/hero.tsx

"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomButton } from "../ui/custom-button";
import { scrollToSection } from "@/lib/scroll-utils";

export function HeroSection() {
  return (
    <section className=" w-full pb-32 sm:min-h-screen relative pt-16">
      {/* Announcement Badge + Heading */}
      <div className="hidden sm:flex flex-col md:flex-row w-full justify-center md:gap-x-3 items-center gap-y-0 mb-20 z-20">
        <div className="flex items-center gap-x-2">
          <Badge
            variant="outline"
            className="bg-green-950/80 border-green-500/50 rounded-full text-xs font-medium px-3 py-1"
          >
            New
          </Badge>
          <h1 className="text-sm lg:text-xl font-semibold tracking-tight text-center leading-0 pb-1 max-w-3xl">
            Catch up on our latest products
          </h1>
        </div>
      </div>

      {/* bg */}
      <div className=" z-0 h-full w-full hidden md:flex flex-col space-y-28 items-center justify-center absolute pb-20 top-0">
        <div className="h-px bg-white/15 w-7/12" />
        <div className="h-px bg-white/15 w-7/12" />
        <div className="h-px bg-white/15 w-7/12" />
        <div className="h-px bg-white/15 w-7/12" />
      </div>
      <div className="z-0  h-full w-full hidden md:flex flex-row space-x-28 items-center justify-center absolute pb-20 top-0">
        <div className="w-px bg-white/15 h-9/12" />
        <div className="w-px bg-white/15 h-9/12" />
        <div className="w-px bg-white/15 h-9/12" />
        <div className="w-px bg-white/15 h-9/12" />
        <div className="w-px bg-white/15 h-9/12" />
        <div className="w-px bg-white/15 h-9/12" />
      </div>

      {/* Main Content Section */}
      <div className="flex flex-col items-center gap-8 z-20">
        <h2 className="max-w-80 sm:max-w-2xl text-4xl md:text-6xl font-bold tracking-tight text-center leading-tight">
          Buy <span className=" text-green-400">Redfinger</span> Redeem Codes
          Instantly
        </h2>

        <p className="text-base lg:text-lg text-secondary max-w-80 sm:max-w-2xl text-center leading-relaxed">
          Get your VIP redeem codes delivered instantly to your dashboard.
          Choose from 7-day or 30-day packages.{" "}
          <span className="text-white font-medium">No waiting, no hassle.</span>{" "}
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4 sm:mt-8 z-10">
          <CustomButton
            variant="white"
            className="px-8 h-12 max-w-40"
            onClick={() => scrollToSection("choose-Product")}
          >
            Start Shopping
          </CustomButton>
          <CustomButton
            variant="black"
            className="px-8 h-12 max-w-40"
            onClick={() => scrollToSection("why-choose-us")}
          >
            Learn More
          </CustomButton>
        </div>

        {/* CLI Command */}
        <div className="flex justify-center mt-0 z-10">
          <code className="bg-white/5 border border-white/10 rounded px-4 py-3 text-xs font-mono text-gray-400">
            ▲ ~ Number 1 RedFinger & VsPhone Sales!
          </code>
        </div>
      </div>
    </section>
  );
}
