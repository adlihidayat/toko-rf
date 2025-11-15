// components/shared/package-card.tsx
import { Badge } from "../ui/badge";
import { CustomButton } from "../ui/custom-button";
import { Cpu, Smartphone, HardDrive, Zap } from "lucide-react";
import { Star } from "lucide-react";

interface SpecItem {
  icon: React.ReactNode;
  label: string;
}

interface PackageCardProps {
  name: string;
  price: string;
  stock: number;
  isOutOfStock?: boolean;
  isMostPopular?: boolean;
  onBuy?: () => void;
  // Specifications
  cpuCore?: string;
  android?: string;
  ram?: string;
  rom?: string;
  bit?: string;
  processor?: string;
  // Rating
  rating?: number;
  reviews?: number;
}

export function PackageCard({
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
}: PackageCardProps) {
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
      className="border bg-stone-900/30 rounded-lg p-6 hover:border-white/20 transition"
      style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
    >
      {/* Header with Name and Badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-0 text-primary">{name}</h3>
          <span className=" text-secondary">{stock} left</span>
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
      <div className="mb-6">
        <p className="text-3xl font-semibold text-white">{price}</p>
      </div>

      {/* Specifications */}
      <div className="space-y-2 mb-6">
        {specs.map((spec, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span style={{ color: "#a1a1a1" }}>{spec.icon}</span>
            <span style={{ color: "#a1a1a1" }}>{spec.label}</span>
          </div>
        ))}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="w-4 h-4 fill-yellow-400"
              style={{ color: "#FFD700" }}
            />
          ))}
        </div>
        <span style={{ color: "#FFD700" }} className="font-semibold text-sm">
          {rating}
        </span>
        <span style={{ color: "#a1a1a1" }} className="text-sm">
          ({reviews.toLocaleString()})
        </span>
      </div>

      {/* Button */}
      <CustomButton disabled={isOutOfStock} variant="white" onClick={onBuy}>
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </CustomButton>
    </div>
  );
}
