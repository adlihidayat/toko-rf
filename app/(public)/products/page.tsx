// app/(public)/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/shared/product-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { ProductService } from "@/lib/db/products";
import { ProductDocument } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoggedIn] = useState(false); // TODO: Get from auth context

  // Fetch products from mock data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await ProductService.getAllProducts();
        setProducts(allProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuyProduct = (productName: string) => {
    console.log(`Added ${productName} to cart`);
    // TODO: Implement add to cart logic
  };

  return (
    <main className="min-h-screen bg-black text-primary md:px-24">
      {/* Header Section */}
      <section className="py-20 px-8 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Section Label */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6 relative">
              <span className="px-3.5 py-1.5 bg-linear-to-r to-[#00E19D] from-[#009AB2] rounded-full text-background z-10 font-bold">
                Complete Collection
              </span>
            </div>

            {/* Main Title */}
            <div className="mb-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-primary mb-4">
                Explore All{" "}
                <span className="bg-linear-to-r from-[#00BCA8] to-[#00E19D] bg-clip-text text-transparent">
                  Premium Products
                </span>
              </h1>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Find the perfect VIP subscription that matches your gaming needs
                and budget
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12  bg-stone-900/30 border-white/10 rounded-lg focus:border-[#00BCA8] transition"
              />
            </div>
          </div>

          {/* Product Count Badge */}
          <div className="flex justify-center mb-12">
            <Badge className="bg-stone-900/50 border border-white/10 text-secondary px-4 py-2">
              Showing {filteredProducts.length} of {products.length} products
            </Badge>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-lg text-secondary">Loading products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div key={product._id} className="h-full">
                  <ProductCard
                    name={product.name}
                    price={`Rp ${product.price.toLocaleString("id-ID")}`}
                    stock={0} // Stock count can be fetched separately if needed
                    isOutOfStock={false}
                    isMostPopular={product.badge === "popular"}
                    cpuCore={product.cpuCore}
                    android={product.android}
                    ram={product.ram}
                    rom={product.rom}
                    bit={product.bit}
                    processor={product.processor}
                    rating={4.8} // You can calculate this from purchases if needed
                    reviews={product.reviews}
                    isLoggedIn={isLoggedIn}
                    onBuy={() => handleBuyProduct(product.name)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg text-secondary mb-2">No products found</p>
              <p className="text-sm text-secondary/60">
                Try adjusting your search terms
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
