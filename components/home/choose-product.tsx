// components/home/choose-product.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "../shared/product-card";
import { CustomButton } from "../ui/custom-button";
import { useUserRole } from "@/app/providers";

interface Product {
  _id: string;
  name: string;
  price: number;
  minimumPurchase: number;
  description: string;
  categoryId: string;
  cpuCore: string;
  android: string;
  ram: string;
  rom: string;
  bit: string;
  processor: string;
  reviews: number;
  badge?: "new" | "best-deal" | "popular" | null;
  availableStock?: number;
  totalStock?: number;
}

export function ChooseProduct() {
  const { role } = useUserRole();
  const isLoggedIn = role === "user" || role === "admin";
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products with badges
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products/featured");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleBrowseMore = useCallback(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    router.push("/products");
  }, [isLoggedIn, router]);

  if (loading) {
    return (
      <section id="choose-Product" className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-secondary">Loading products...</div>
        </div>
      </section>
    );
  }

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
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  _id={product._id}
                  name={product.name}
                  price={`Rp ${product.price.toLocaleString("id-ID")}`}
                  stock={product.availableStock || 0}
                  isOutOfStock={
                    !product.availableStock || product.availableStock === 0
                  }
                  isMostPopular={product.badge === "popular"}
                  cpuCore={product.cpuCore}
                  android={product.android}
                  ram={product.ram}
                  rom={product.rom}
                  bit={product.bit}
                  processor={product.processor}
                  rating={4.8}
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
          </>
        ) : (
          <div className="text-center text-secondary py-12">
            No featured products available at the moment
          </div>
        )}
      </div>
    </section>
  );
}
