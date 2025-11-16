// app/admin/products-management/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Star,
  Box,
  Ellipsis,
  Tag,
} from "lucide-react";
import { ProductService } from "@/lib/db/products";
import { StockService } from "@/lib/db/stocks";
import { PurchaseService } from "@/lib/db/purchases";
import { CategoryService } from "@/lib/db/categories";
import {
  CreateProductInput,
  CreateStockInput,
  ProductDocument,
  StockWithProductInfo,
  PurchaseWithDetails,
  CategoryWithStockCount,
  CreateCategoryInput,
} from "@/lib/types";
import {
  ProductDialog,
  StockDialog,
  DeleteDialog,
  CategoryDialog,
} from "@/components/admin/ProductStockDialogs";

type ViewMode = "products" | "stocks" | "purchases" | "categories";

export default function ProductManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("products");
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [stocks, setStocks] = useState<StockWithProductInfo[]>([]);
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryWithStockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productDialogMode, setProductDialogMode] = useState<"add" | "edit">(
    "add"
  );
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockDialogMode, setStockDialogMode] = useState<"add" | "edit">("add");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<"add" | "edit">(
    "add"
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductDocument | null>(null);
  const [selectedStock, setSelectedStock] =
    useState<StockWithProductInfo | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithStockCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    "product" | "stock" | "category" | null
  >(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allProducts, allStocks, allPurchases, allCategories] =
          await Promise.all([
            ProductService.getAllProducts(),
            StockService.getAllStocksWithProductInfo(),
            PurchaseService.getAllPurchases(),
            CategoryService.getAllCategoriesWithStockCount(),
          ]);
        setProducts(allProducts);
        setStocks(allStocks);
        setPurchases(allPurchases);
        setCategories(allCategories);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter data
  const filteredData =
    viewMode === "products"
      ? products.filter((p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : viewMode === "stocks"
      ? stocks.filter(
          (s) =>
            s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.redeemCode.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : viewMode === "purchases"
      ? purchases.filter(
          (p) =>
            p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.redeemCode.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : categories.filter((c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, viewMode]);

  // Calculate stats
  const totalStock = stocks.length;
  const totalProducts = products.length;
  const totalPurchases = purchases.length;
  const totalCategories = categories.length;

  // Calculate average product rating from purchases
  const ratedPurchases = purchases.filter((p) => p.rating !== null);
  const avgProductRating =
    ratedPurchases.length > 0
      ? (
          ratedPurchases.reduce((sum, p) => sum + (p.rating || 0), 0) /
          ratedPurchases.length
        ).toFixed(1)
      : "0";

  const handleAddProduct = () => {
    setProductDialogMode("add");
    setSelectedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: ProductDocument) => {
    setProductDialogMode("edit");
    setSelectedProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (product: ProductDocument) => {
    setSelectedProduct(product);
    setDeleteTarget("product");
    setIsDeleteOpen(true);
  };

  const handleDeleteStock = (stock: StockWithProductInfo) => {
    setSelectedStock(stock);
    setDeleteTarget("stock");
    setIsDeleteOpen(true);
  };

  const handleEditStock = (stock: StockWithProductInfo) => {
    setStockDialogMode("edit");
    setSelectedStock(stock);
    setIsStockDialogOpen(true);
  };

  const handleAddCategory = () => {
    setCategoryDialogMode("add");
    setSelectedCategory(null);
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: CategoryWithStockCount) => {
    setCategoryDialogMode("edit");
    setSelectedCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: CategoryWithStockCount) => {
    setSelectedCategory(category);
    setDeleteTarget("category");
    setIsDeleteOpen(true);
  };

  const onProductSubmit = async (data: CreateProductInput) => {
    try {
      if (productDialogMode === "edit" && selectedProduct) {
        const updated = await ProductService.updateProduct(
          selectedProduct._id,
          data
        );
        if (updated) {
          setProducts(
            products.map((p) => (p._id === updated._id ? updated : p))
          );
        }
      } else {
        const newProduct = await ProductService.createProduct(data);
        setProducts([...products, newProduct]);
      }
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const onStockSubmit = async (
    data: CreateStockInput | { productId: string; redeemCode: string }
  ) => {
    try {
      if (stockDialogMode === "edit" && selectedStock) {
        await StockService.updateStock(selectedStock._id, {
          productId: data.productId,
          redeemCode: data.redeemCode,
        });
        const allStocks = await StockService.getAllStocksWithProductInfo();
        setStocks(allStocks);
      } else {
        const codes = data.redeemCode
          .split("\n")
          .map((code) => code.trim())
          .filter((code) => code.length > 0);

        for (const code of codes) {
          await StockService.createStock({
            productId: data.productId,
            redeemCode: code,
          });
        }
        const allStocks = await StockService.getAllStocksWithProductInfo();
        setStocks(allStocks);
      }
    } catch (error) {
      console.error("Failed to add/edit stock:", error);
    }
  };

  const onCategorySubmit = async (data: CreateCategoryInput) => {
    try {
      if (categoryDialogMode === "edit" && selectedCategory) {
        const updated = await CategoryService.updateCategory(
          selectedCategory._id,
          data
        );
        if (updated) {
          const allCategories =
            await CategoryService.getAllCategoriesWithStockCount();
          setCategories(allCategories);
        }
      } else {
        await CategoryService.createCategory(data);
        const allCategories =
          await CategoryService.getAllCategoriesWithStockCount();
        setCategories(allCategories);
      }
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const onDeleteConfirm = async () => {
    try {
      if (deleteTarget === "product" && selectedProduct) {
        await ProductService.deleteProduct(selectedProduct._id);
        setProducts(products.filter((p) => p._id !== selectedProduct._id));
      } else if (deleteTarget === "stock" && selectedStock) {
        await StockService.deleteStock(selectedStock._id);
        setStocks(stocks.filter((s) => s._id !== selectedStock._id));
      } else if (deleteTarget === "category" && selectedCategory) {
        await CategoryService.deleteCategory(selectedCategory._id);
        const allCategories =
          await CategoryService.getAllCategoriesWithStockCount();
        setCategories(allCategories);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Product Management
        </h1>
        <p className="text-secondary">
          Manage your products, inventory, categories, and purchases
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Total Products</p>
              <p className="text-3xl font-bold text-primary">{totalProducts}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              +12.5%
            </div>
          </div>
          <p className="text-secondary text-sm">All products in catalog</p>
        </div>

        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Total Stock Units</p>
              <p className="text-3xl font-bold text-primary">{totalStock}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              +8.2%
            </div>
          </div>
          <p className="text-secondary text-sm">Individual stock items</p>
        </div>

        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Total Purchases</p>
              <p className="text-3xl font-bold text-primary">
                {totalPurchases}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              +15.3%
            </div>
          </div>
          <p className="text-secondary text-sm">Completed transactions</p>
        </div>

        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-primary">
                {avgProductRating}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              +2.3%
            </div>
          </div>
          <p className="text-secondary text-sm">From customer reviews</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <Button
          variant={viewMode === "products" ? "default" : "outline"}
          onClick={() => setViewMode("products")}
          className={
            viewMode === "products"
              ? "bg-primary text-black hover:bg-primary"
              : "border-white/10 hover:bg-stone-800 hover:text-primary cursor-pointer"
          }
        >
          Products
        </Button>
        <Button
          variant={viewMode === "categories" ? "default" : "outline"}
          onClick={() => setViewMode("categories")}
          className={
            viewMode === "categories"
              ? "bg-primary text-black hover:bg-primary"
              : "border-white/10 hover:bg-stone-800 hover:text-primary cursor-pointer"
          }
        >
          Manage Categories
        </Button>
        <Button
          variant={viewMode === "stocks" ? "default" : "outline"}
          onClick={() => setViewMode("stocks")}
          className={
            viewMode === "stocks"
              ? "bg-primary text-black hover:bg-primary"
              : "border-white/10 hover:bg-stone-800 hover:text-primary cursor-pointer"
          }
        >
          Stocks
        </Button>
        <Button
          variant={viewMode === "purchases" ? "default" : "outline"}
          onClick={() => setViewMode("purchases")}
          className={
            viewMode === "purchases"
              ? "bg-primary text-black hover:bg-primary"
              : "border-white/10 hover:bg-stone-800 hover:text-primary cursor-pointer"
          }
        >
          Purchase History
        </Button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="flex-1 max-w-md">
          <Input
            placeholder={
              viewMode === "products"
                ? "Search products..."
                : viewMode === "stocks"
                ? "Search stocks by name or code..."
                : viewMode === "purchases"
                ? "Search purchases..."
                : "Search categories..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-stone-900/30 border-white/10"
          />
        </div>
        {viewMode !== "purchases" && (
          <Button
            className="bg-primary text-black hover:bg-stone-400 gap-2 cursor-pointer"
            onClick={
              viewMode === "products"
                ? handleAddProduct
                : viewMode === "stocks"
                ? () => {
                    setStockDialogMode("add");
                    setSelectedStock(null);
                    setIsStockDialogOpen(true);
                  }
                : viewMode === "categories"
                ? handleAddCategory
                : undefined
            }
          >
            <Plus className="w-4 h-4" />
            {viewMode === "products"
              ? "Add Product"
              : viewMode === "stocks"
              ? "Add Stock"
              : "Add Category"}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-background border border-white/10 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary">Loading...</div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            {searchTerm ? "No items found" : `No ${viewMode} yet`}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {viewMode === "products" ? (
                  <>
                    <TableHead className="text-primary">Title</TableHead>
                    <TableHead className="text-primary">Price</TableHead>
                    <TableHead className="text-primary">Stock Count</TableHead>
                    <TableHead className="text-primary">Min Purchase</TableHead>
                    <TableHead className="text-primary">Rating</TableHead>
                    <TableHead className="text-primary text-right"></TableHead>
                  </>
                ) : viewMode === "stocks" ? (
                  <>
                    <TableHead className="text-primary">Product</TableHead>
                    <TableHead className="text-primary">Redeem Code</TableHead>
                    <TableHead className="text-primary">Added Date</TableHead>
                    <TableHead className="text-primary">Status</TableHead>
                    <TableHead className="text-primary text-right"></TableHead>
                  </>
                ) : viewMode === "purchases" ? (
                  <>
                    <TableHead className="text-primary">Product</TableHead>
                    <TableHead className="text-primary">Customer</TableHead>
                    <TableHead className="text-primary">Redeem Code</TableHead>
                    <TableHead className="text-primary">Amount</TableHead>
                    <TableHead className="text-primary">Rating</TableHead>
                    <TableHead className="text-primary">Date</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-primary w-10">Icon</TableHead>
                    <TableHead className="text-primary pl-5 w-80">
                      Category Name
                    </TableHead>
                    <TableHead className="text-primary">Total Stock</TableHead>
                    <TableHead className="text-primary text-right"></TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewMode === "products"
                ? (paginatedData as ProductDocument[]).map((product) => {
                    const stockCount = stocks.filter(
                      (s) => s.productId === product._id
                    ).length;
                    const productPurchases = purchases.filter(
                      (p) => p.productId === product._id && p.rating !== null
                    );
                    const productAvgRating =
                      productPurchases.length > 0
                        ? (
                            productPurchases.reduce(
                              (sum, p) => sum + (p.rating || 0),
                              0
                            ) / productPurchases.length
                          ).toFixed(1)
                        : "0";
                    return (
                      <TableRow
                        key={product._id}
                        className="border-white/10 hover:bg-white/5 transition"
                      >
                        <TableCell className="font-medium text-primary">
                          <div className="flex items-center gap-2">
                            <span>{product.name}</span>
                            {product.badge && (
                              <Badge
                                className={
                                  product.badge === "popular"
                                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                    : product.badge === "best-deal"
                                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                                    : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                }
                              >
                                {product.badge === "popular"
                                  ? "Popular"
                                  : product.badge === "best-deal"
                                  ? "Best Deal"
                                  : "New"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-secondary">
                          <div className="flex items-center gap-x-1.5">
                            <span className="text-secondary">Rp</span>
                            <span className="text-primary">
                              {product.price.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={stockCount > 0 ? "outline" : "destructive"}
                            className={
                              stockCount > 0
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : "bg-red-500/20 text-red-300 border-red-500/30"
                            }
                          >
                            {stockCount} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-x-1.5">
                            <Box className="w-3 text-secondary" />
                            <span className="text-primary">
                              {product.minimumPurchase} pcs
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="flex items-center gap-x-1.5">
                          <Star className="w-3 text-secondary" />
                          <span className="text-primary">
                            {productAvgRating}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <Ellipsis className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditProduct(product)}
                                className="focus:bg-stone-800 focus:text-primary"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-400 focus:bg-stone-800 focus:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                : viewMode === "stocks"
                ? (paginatedData as StockWithProductInfo[]).map((stock) => (
                    <TableRow
                      key={stock._id}
                      className="border-white/10 hover:bg-white/5 transition"
                    >
                      <TableCell className="font-medium text-primary">
                        {stock.productName}
                      </TableCell>
                      <TableCell className="text-secondary">
                        {stock.redeemCode}
                      </TableCell>
                      <TableCell className="text-secondary">
                        {stock.addedDate.toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            stock.isAvailable
                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                              : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                          }
                        >
                          {stock.isAvailable ? "Available" : "Purchased"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Ellipsis className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditStock(stock)}
                              className="focus:bg-stone-800 focus:text-primary"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteStock(stock)}
                              className="text-red-400 focus:bg-stone-800 focus:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                : viewMode === "purchases"
                ? (paginatedData as PurchaseWithDetails[]).map((purchase) => (
                    <TableRow
                      key={purchase._id}
                      className="border-white/10 hover:bg-white/5 transition h-12"
                    >
                      <TableCell className="font-medium text-primary">
                        {purchase.productName}
                      </TableCell>
                      <TableCell className="text-secondary">
                        {purchase.userName}
                      </TableCell>
                      <TableCell className="text-secondary">
                        {purchase.redeemCode}
                      </TableCell>
                      <TableCell className="text-primary">
                        Rp {purchase.totalPaid.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        {purchase.rating !== null ? (
                          <div className="flex items-center gap-x-1.5">
                            <Star className="w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-primary">
                              {purchase.rating}
                            </span>
                          </div>
                        ) : (
                          <Badge className="bg-stone-700/50 text-stone-300 border-stone-600/30">
                            None
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-secondary">
                        {purchase.createdAt.toLocaleDateString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))
                : (paginatedData as CategoryWithStockCount[]).map(
                    (category) => (
                      <TableRow
                        key={category._id}
                        className="border-white/10 hover:bg-white/5 transition"
                      >
                        <TableCell className="text-center">
                          <img
                            src={category.icon}
                            alt={category.name}
                            className="w-7 h-7 object-cover mx-auto rounded-lg border border-stone-700"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/48?text=No+Image";
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-primary pl-5">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {category.stockCount} items
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <Ellipsis className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditCategory(category)}
                                className="focus:bg-stone-800 focus:text-primary"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteCategory(category)}
                                className="text-red-400 focus:bg-stone-800 focus:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {paginatedData.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Dialogs */}
      <ProductDialog
        open={isProductDialogOpen}
        mode={productDialogMode}
        onOpenChange={setIsProductDialogOpen}
        onSubmit={onProductSubmit}
        initialData={selectedProduct || undefined}
        categories={categories}
      />

      <StockDialog
        open={isStockDialogOpen}
        mode={stockDialogMode}
        onOpenChange={(open) => {
          if (!open) {
            setIsStockDialogOpen(false);
            setSelectedStock(null);
          }
        }}
        onSubmit={onStockSubmit}
        products={products}
        initialData={selectedStock}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        mode={categoryDialogMode}
        onOpenChange={setIsCategoryDialogOpen}
        onSubmit={onCategorySubmit}
        initialData={selectedCategory || undefined}
      />

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={onDeleteConfirm}
        title={`Delete ${
          deleteTarget === "product"
            ? "Product"
            : deleteTarget === "stock"
            ? "Stock"
            : "Category"
        }`}
        description={
          deleteTarget === "product"
            ? `Are you sure you want to delete "${selectedProduct?.name}"? All associated stocks will also be deleted. This action cannot be undone.`
            : deleteTarget === "stock"
            ? `Are you sure you want to delete stock "${selectedStock?.redeemCode}"? This action cannot be undone.`
            : `Are you sure you want to delete category "${selectedCategory?.name}"? This action cannot be undone.`
        }
      />
    </div>
  );
}
