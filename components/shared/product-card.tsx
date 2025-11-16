// components/shared/product-card.tsx
"use client";

import { Badge } from "../ui/badge";
import { CustomButton } from "../ui/custom-button";
import { Cpu, Smartphone, HardDrive, Zap } from "lucide-react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface SpecItem {
  icon: React.ReactNode;
  label: string;
}

interface ProductCardProps {
  _id: string; // productId - REQUIRED
  name: string;
  price: string;
  stock: number;
  isOutOfStock?: boolean;
  isMostPopular?: boolean;
  onBuy?: () => void;
  cpuCore?: string;
  android?: string;
  ram?: string;
  rom?: string;
  bit?: string;
  processor?: string;
  rating?: number;
  reviews?: number;
  isLoggedIn?: boolean;
  minimumPurchase?: number;
}

export function ProductCard({
  _id,
  name,
  price,
  isMostPopular,
  stock,
  isOutOfStock = false,
  onBuy,
  cpuCore = "8 core cpu",
  android = "Android 12",
  ram = "4G RAM",
  rom = "64G ROM",
  bit = "64 BIT",
  processor = "Qualcomm",
  rating = 4.8,
  reviews = 6521,
  isLoggedIn = false,
  minimumPurchase = 1,
}: ProductCardProps) {
  const router = useRouter();

  const handleBuyNow = useCallback(() => {
    console.log("🛒 Buy Now clicked!");
    console.log("📦 Product ID:", _id);
    console.log("🔐 Is Logged In:", isLoggedIn);
    console.log("🍪 Cookies:", document.cookie);

    // If not logged in, go to login
    if (!isLoggedIn) {
      console.log("❌ User not logged in - redirecting to /login");
      router.push("/login");
      return;
    }

    // Navigate to checkout
    const checkoutUrl = `/checkout?productId=${_id}`;
    console.log("✅ User logged in - navigating to:", checkoutUrl);
    router.push(checkoutUrl);
  }, [isLoggedIn, _id, router]);

  const specs: SpecItem[] = [
    { icon: <Cpu className="w-4 h-4" />, label: cpuCore },
    { icon: <Smartphone className="w-4 h-4" />, label: android },
    { icon: <HardDrive className="w-4 h-4" />, label: ram },
    { icon: <HardDrive className="w-4 h-4" />, label: rom },
    { icon: <Zap className="w-4 h-4" />, label: bit },
    { icon: <Zap className="w-4 h-4" />, label: processor },
  ];

  return (
    <div
      className="border bg-stone-900/40 rounded-lg py-6 px-8 hover:border-white/20 transition"
      style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
    >
      {/* Header with Name and Badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1 text-primary">{name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star
                className="w-4 h-4 fill-yellow-400"
                style={{ color: "#FFD700" }}
              />
            </div>
            <span
              style={{ color: "#FFD700" }}
              className="font-semibold text-sm"
            >
              {rating}
            </span>
            <span style={{ color: "#a1a1a1" }} className="text-sm">
              ({reviews.toLocaleString()})
            </span>
          </div>
        </div>
        {isMostPopular && (
          <Badge
            variant="outline"
            className="bg-green-950/80 border-green-500/50 text-green-500 rounded-full text-xs font-medium px-3 py-1"
          >
            Popular Item
          </Badge>
        )}
      </div>

      {/* Price */}
      <div className="mb-8">
        <p className="text-3xl font-semibold text-white">{price}</p>
      </div>

      {/* Button */}
      <CustomButton
        disabled={isOutOfStock}
        variant="white"
        onClick={handleBuyNow}
        className="rounded-full"
      >
        {isOutOfStock ? "Out of Stock" : "Buy Now"}
      </CustomButton>

      <div className=" w-full h-px bg-white/15 my-5"></div>

      <div className="space-y-2">
        <p>Specifications :</p>
        {specs.map((spec, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span style={{ color: "#a1a1a1" }}>{spec.icon}</span>
            <span style={{ color: "#a1a1a1" }}>{spec.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
