// components/home/choose-package.tsx
"use client";
import Link from "next/link";
import { PackageCard } from "../shared/package-card";
import { CustomButton } from "../ui/custom-button";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

const packages = [
  {
    name: "VIP 7 DAY",
    price: "Rp 19.300",
    stock: 0,
    isOutOfStock: true,
    isMostPopular: false,
    cpuCore: "8 core cpu",
    android: "Android 12",
    ram: "4G RAM",
    rom: "64G ROM",
    bit: "64 BIT",
    processor: "Qualcomm",
    rating: 4.8,
    reviews: 6521,
  },
  {
    name: "VIP 30 DAY",
    price: "Rp 60.000",
    stock: 0,
    isOutOfStock: true,
    isMostPopular: false,
    cpuCore: "8 core cpu",
    android: "Android 12",
    ram: "4G RAM",
    rom: "64G ROM",
    bit: "64 BIT",
    processor: "Qualcomm",
    rating: 4.8,
    reviews: 6521,
  },
  {
    name: "VIP 90 DAY",
    price: "Rp 150.000",
    stock: 5,
    isOutOfStock: false,
    isMostPopular: true,
    cpuCore: "8 core cpu",
    android: "Android 12",
    ram: "4G RAM",
    rom: "64G ROM",
    bit: "64 BIT",
    processor: "Qualcomm",
    rating: 4.8,
    reviews: 6521,
  },
];

export function ChoosePackage() {
  const isLoggedIn = false; // TODO: Get this from your auth context/state
  const router = useRouter();

  const handleBuyPackage = useCallback((packageName: string) => {
    console.log(`Bought ${packageName}`);
    // TODO: Add to cart logic here
  }, []);

  const handleBrowseMore = useCallback(() => {
    if (!isLoggedIn) {
      // Redirect to login if not logged in
      router.push("/login");
      return;
    }

    // Call the onBuy callback if user is logged in
    // if (onBuy) {
    //   onBuy();
    // }
  }, [isLoggedIn, router]);

  return (
    <section id="choose-package" className="py-20 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-6 relative">
            <div className="h-36 bg-linear-to-b from-[#00BCA8]/10 to-[#00BCA8] w-px absolute bottom-0 z-0"></div>
            <span className="px-3.5 py-1.5 bg-linear-to-r to-[#00E19D] from-[#009AB2] rounded-full text-background z-10 font-bold">
              3
            </span>
          </div>
          <div className="mb-4">
            <span className="text-2xl font-semibold text-primary">
              lots of choices
            </span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold tracking-tight text-center mb-4 text-primary">
            Choose Your Package
          </h2>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Select the VIP duration that suits your needs
          </p>
        </div>

        {/* Package Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {packages.map((pkg, index) => (
            <PackageCard
              key={index}
              name={pkg.name}
              price={pkg.price}
              stock={pkg.stock}
              isOutOfStock={pkg.isOutOfStock}
              isMostPopular={pkg.isMostPopular}
              cpuCore={pkg.cpuCore}
              android={pkg.android}
              ram={pkg.ram}
              rom={pkg.rom}
              bit={pkg.bit}
              processor={pkg.processor}
              rating={pkg.rating}
              reviews={pkg.reviews}
              isLoggedIn={isLoggedIn}
              onBuy={() => handleBuyPackage(pkg.name)}
            />
          ))}
        </div>

        {/* Browse More Button */}
        <div className="flex justify-center">
          <CustomButton
            variant="black"
            onClick={handleBrowseMore}
            className=" w-52 rounded-lg"
          >
            Browse More Packages
          </CustomButton>
        </div>
      </div>
    </section>
  );
}
