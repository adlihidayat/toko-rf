// components/home/choose-product.tsx
"use client";
import Link from "next/link";
import { ProductCard } from "../shared/product-card";
import { CustomButton } from "../ui/custom-button";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

const Products = [
  {
    _id: "item_003",
    name: "VIP 7 DAY",
    price: "Rp 19.300",
    stock: 0,
    isOutOfStock: true,
    isMostPopular: false,
    cpuCore: "4 core cpu",
    android: "Android 10",
    ram: "2G RAM",
    rom: "16G ROM",
    bit: "32 BIT",
    processor: "Snapdragon",
    rating: 4.8,
    reviews: 1823,
    minimumPurchase: 5,
  },
  {
    _id: "item_002",
    name: "VIP 30 DAY",
    price: "Rp 60.000",
    stock: 0,
    isOutOfStock: false,
    isMostPopular: false,
    cpuCore: "6 core cpu",
    android: "Android 11",
    ram: "3G RAM",
    rom: "32G ROM",
    bit: "64 BIT",
    processor: "MediaTek",
    rating: 4.8,
    reviews: 3245,
    minimumPurchase: 2,
  },
  {
    _id: "item_001",
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
    minimumPurchase: 1,
  },
];

export function ChooseProduct() {
  const isLoggedIn = false; // TODO: Get this from your auth context/state
  const router = useRouter();

  const handleBrowseMore = useCallback(() => {
    if (!isLoggedIn) {
      // Redirect to login if not logged in
      router.push("/login");
      return;
    }
    router.push("/products");
  }, [isLoggedIn, router]);

  return (
    <section id="choose-Product" className="py-20 px-8">
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
            Choose Your Product
          </h2>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Select the VIP duration that suits your needs
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {Products.map((product) => (
            <ProductCard
              key={product._id}
              _id={product._id}
              name={product.name}
              price={product.price}
              stock={product.stock}
              isOutOfStock={product.isOutOfStock}
              isMostPopular={product.isMostPopular}
              cpuCore={product.cpuCore}
              android={product.android}
              ram={product.ram}
              rom={product.rom}
              bit={product.bit}
              processor={product.processor}
              rating={product.rating}
              reviews={product.reviews}
              isLoggedIn={isLoggedIn}
              minimumPurchase={product.minimumPurchase}
            />
          ))}
        </div>

        {/* Browse More Button */}
        <div className="flex justify-center">
          <CustomButton
            variant="black"
            onClick={handleBrowseMore}
            className="w-52 rounded-lg"
          >
            Browse More Products
          </CustomButton>
        </div>
      </div>
    </section>
  );
}
