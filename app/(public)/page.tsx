// app/(public)/page.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { HeroSection } from "@/components/home/hero";
import { WhatIsRedfinger } from "@/components/home/what-is-redfinger";
import { ChoosePackage } from "@/components/home/choose-package";
import { ReadyToStart } from "@/components/home/ready-to-start";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-primary ">
      <HeroSection />
      <WhyChooseUs />
      <WhatIsRedfinger />
      <ChoosePackage />
      <ReadyToStart />
    </main>
  );
}
