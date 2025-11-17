// app/(public)/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/shared/product-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft } from "lucide-react";
import { ProductDocument, CategoryWithStockCount } from "@/lib/types";

interface ProductWithStock extends ProductDocument {
  availableStockCount: number;
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<CategoryWithStockCount[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithStockCount | null>(null);

  // Get product count for a category
  const getProductCountInCategory = (categoryId: string) => {
    return products.filter((p) => p.categoryId === categoryId).length;
  };

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split(";");
      const userId = cookies.find((cookie) =>
        cookie.trim().startsWith("user-id=")
      );
      const userRole = cookies.find((cookie) =>
        cookie.trim().startsWith("user-role=")
      );
      const hasAuth = !!(userId && userRole);

      console.log("🔍 Auth Check:");
      console.log("  - User ID found:", !!userId);
      console.log("  - User role found:", !!userRole);
      console.log("  - Is logged in:", hasAuth);

      setIsLoggedIn(hasAuth);
    };

    checkAuth();
  }, []);

  // Fetch categories and products on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, productsRes, stocksRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
          fetch("/api/stocks"),
        ]);

        const [categoriesData, productsData, stocksData] = await Promise.all([
          categoriesRes.json(),
          productsRes.json(),
          stocksRes.json(),
        ]);

        if (
          categoriesData.success &&
          productsData.success &&
          stocksData.success
        ) {
          // Count available stocks per product
          const availableStocksByProduct: Record<string, number> = {};

          if (Array.isArray(stocksData.data)) {
            stocksData.data.forEach((stock: any) => {
              if (stock.status === "available") {
                availableStocksByProduct[stock.productId] =
                  (availableStocksByProduct[stock.productId] || 0) + 1;
              }
            });
          }

          // Add available stock count to products
          const productsWithStock = productsData.data.map(
            (product: ProductDocument) => ({
              ...product,
              availableStockCount:
                availableStocksByProduct[product._id ?? ""] || 0,
            })
          );

          setCategories(categoriesData.data);
          setProducts(productsWithStock);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter based on view mode (category or product)
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = selectedCategory
    ? products
        .filter((p) => p.categoryId === (selectedCategory._id ?? ""))
        .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleSelectCategory = (category: CategoryWithStockCount) => {
    setSelectedCategory(category);
    setSearchTerm("");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSearchTerm("");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-primary">
        <div className="text-center py-40">
          <p className="text-lg text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-primary md:px-24">
      <section className="py-20 px-8 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="mb-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-primary mb-4">
                {selectedCategory ? (
                  <>{selectedCategory.name} Products</>
                ) : (
                  <>Explore All Premium Categories</>
                )}
              </h1>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                {selectedCategory
                  ? "Find the perfect product that matches your needs"
                  : "Choose a category to explore our premium VIP subscriptions"}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mb-10">
            {selectedCategory && (
              <Button
                onClick={handleBackToCategories}
                variant="outline"
                className="mb-6 border-white/10 hover:bg-stone-800 hover:text-primary cursor-pointer flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Categories
              </Button>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
                  <Input
                    type="text"
                    placeholder={
                      selectedCategory
                        ? "Search products..."
                        : "Search categories..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-stone-900/30 border-white/10 rounded-lg focus:border-[#00BCA8] transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-stone-900/50 border border-white/10 text-secondary px-4 py-2 whitespace-nowrap">
                  {selectedCategory ? (
                    <>
                      <span className="text-[#00BCA8]">
                        {filteredProducts.length}
                      </span>{" "}
                      of{" "}
                      <span className="text-[#00BCA8]">
                        {getProductCountInCategory(selectedCategory._id ?? "")}
                      </span>{" "}
                      products
                    </>
                  ) : (
                    <>
                      <span className="text-[#00BCA8]">
                        {filteredCategories.length}
                      </span>{" "}
                      of{" "}
                      <span className="text-[#00BCA8]">
                        {categories.length}
                      </span>{" "}
                      categories
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* CATEGORIES VIEW */}
          {!selectedCategory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div
                    key={category._id}
                    onClick={() => handleSelectCategory(category)}
                    className="cursor-pointer group bg-stone-900/50 border border-white/10 rounded-lg p-8 hover:border-[#00BCA8]/50 transition hover:bg-stone-900/70 hover:shadow-lg hover:shadow-[#00BCA8]/10"
                  >
                    <div className="mb-6 overflow-hidden rounded-lg h-48 bg-stone-800/50 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-stone-900/40 z-10"></div>
                      <img
                        src={category.icon}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/400?text=No+Image";
                        }}
                      />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-primary mb-3">
                        {category.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-secondary group-hover:text-[#00BCA8] transition">
                          Explore products →
                        </p>
                        <Badge className="bg-background text-secondary border-secondary pb-1">
                          {getProductCountInCategory(category._id ?? "")}{" "}
                          products
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <p className="text-lg text-secondary mb-2">
                    No categories found
                  </p>
                  <p className="text-sm text-secondary/60">
                    Try adjusting your search terms
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* PRODUCTS VIEW */
            <div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="h-full">
                      <ProductCard
                        _id={product._id ?? ""}
                        name={product.name}
                        price={`Rp ${product.price.toLocaleString("id-ID")}`}
                        stock={product.availableStockCount}
                        isOutOfStock={product.availableStockCount === 0}
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-lg text-secondary mb-2">
                    No products found in this category
                  </p>
                  <p className="text-sm text-secondary/60">
                    Try searching or going back
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
