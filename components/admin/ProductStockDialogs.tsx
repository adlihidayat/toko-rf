// components/admin/ProductStockDialogs.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreateProductInput,
  CreateStockInput,
  ProductDocument,
  StockWithProductInfo,
} from "@/lib/types";

interface ProductDialogProps {
  open: boolean;
  mode: "add" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  initialData?: ProductDocument;
}

interface StockDialogProps {
  open: boolean;
  mode: "add" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: CreateStockInput | { productId: string; redeemCode: string }
  ) => Promise<void>;
  products: ProductDocument[];
  initialData?: StockWithProductInfo | null;
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
}

const INITIAL_PRODUCT_FORM: CreateProductInput = {
  name: "",
  price: 0,
  minimumPurchase: 1,
  description: "",
  cpuCore: "",
  android: "",
  ram: "",
  rom: "",
  bit: "",
  processor: "",
  reviews: 0,
  badge: null,
};

const INITIAL_STOCK_FORM = {
  productId: "",
  redeemCode: "",
};

export function ProductDialog({
  open,
  mode,
  onOpenChange,
  onSubmit,
  initialData,
}: ProductDialogProps) {
  const [formData, setFormData] = useState<CreateProductInput>(
    initialData || INITIAL_PRODUCT_FORM
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.name,
        price: initialData.price,
        minimumPurchase: initialData.minimumPurchase,
        description: initialData.description,
        cpuCore: initialData.cpuCore,
        android: initialData.android,
        ram: initialData.ram,
        rom: initialData.rom,
        bit: initialData.bit,
        processor: initialData.processor,
        reviews: initialData.reviews,
        badge: initialData.badge,
      });
    } else if (open && !initialData) {
      setFormData(INITIAL_PRODUCT_FORM);
    }
  }, [open, initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "badge"
          ? value === "null"
            ? null
            : value
          : ["price", "minimumPurchase", "reviews"].includes(name)
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData(INITIAL_PRODUCT_FORM);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background border-stone-800 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        <DialogHeader className="border-b border-stone-800 pb-6">
          <DialogTitle className="text-2xl font-bold text-primary">
            {mode === "edit" ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-primary mb-2 block">
                Product Name
              </Label>
              <Input
                name="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-primary mb-2 block">
                Price (Rp)
              </Label>
              <Input
                type="number"
                name="price"
                placeholder="0"
                value={formData.price}
                onChange={handleChange}
                className="bg-stone-900/50 border-stone-800 text-primary h-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-primary mb-2 block">
                Minimum Purchase
              </Label>
              <Input
                type="number"
                name="minimumPurchase"
                placeholder="1"
                value={formData.minimumPurchase}
                onChange={handleChange}
                className="bg-stone-900/50 border-stone-800 text-primary h-10"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-primary mb-2 block">
                Description
              </Label>
              <Input
                name="description"
                placeholder="Product description"
                value={formData.description}
                onChange={handleChange}
                className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-primary mb-2 block">
                Badge
              </Label>
              <Select
                value={formData.badge || "null"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    badge: value === "null" ? null : (value as any),
                  })
                }
              >
                <SelectTrigger className="bg-stone-900/50 border-stone-800 text-primary h-10">
                  <SelectValue placeholder="Select badge" />
                </SelectTrigger>
                <SelectContent className="bg-stone-900 border-stone-800">
                  <SelectItem value="null" className="text-primary">
                    None
                  </SelectItem>
                  <SelectItem value="new" className="text-primary">
                    New
                  </SelectItem>
                  <SelectItem value="best-deal" className="text-primary">
                    Best Deal
                  </SelectItem>
                  <SelectItem value="popular" className="text-primary">
                    Popular
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-stone-800"></div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-primary">
              Specifications
            </h3>
            <div>
              <Label className="text-sm font-medium text-primary mb-2 block">
                CPU Core
              </Label>
              <Input
                name="cpuCore"
                placeholder="e.g. 8 core cpu"
                value={formData.cpuCore}
                onChange={handleChange}
                className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-primary mb-2 block">
                  Android
                </Label>
                <Input
                  name="android"
                  placeholder="e.g. Android 12"
                  value={formData.android}
                  onChange={handleChange}
                  className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-primary mb-2 block">
                  Processor
                </Label>
                <Input
                  name="processor"
                  placeholder="e.g. Qualcomm"
                  value={formData.processor}
                  onChange={handleChange}
                  className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-primary mb-2 block">
                  RAM
                </Label>
                <Input
                  name="ram"
                  placeholder="e.g. 4G RAM"
                  value={formData.ram}
                  onChange={handleChange}
                  className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-primary mb-2 block">
                  ROM
                </Label>
                <Input
                  name="rom"
                  placeholder="e.g. 64G ROM"
                  value={formData.rom}
                  onChange={handleChange}
                  className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-primary mb-2 block">
                  Bit
                </Label>
                <Input
                  name="bit"
                  placeholder="e.g. 64 BIT"
                  value={formData.bit}
                  onChange={handleChange}
                  className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-primary mb-2 block">
                  Reviews Count
                </Label>
                <Input
                  type="number"
                  name="reviews"
                  placeholder="0"
                  value={formData.reviews}
                  onChange={handleChange}
                  className="bg-stone-900/50 border-stone-800 text-primary h-10"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 border-t border-stone-800 pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-stone-800 text-secondary hover:text-primary hover:bg-stone-900/50"
          >
            Cancel
          </Button>
          <Button
            className="bg-primary text-black hover:bg-gray-200 px-8"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StockDialog({
  open,
  mode,
  onOpenChange,
  onSubmit,
  products,
  initialData,
}: StockDialogProps) {
  const [formData, setFormData] = useState({
    productId: initialData?.productId || "",
    redeemCode: initialData?.redeemCode || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        productId: initialData.productId,
        redeemCode: initialData.redeemCode,
      });
    } else if (open && !initialData) {
      setFormData(INITIAL_STOCK_FORM);
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData(INITIAL_STOCK_FORM);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, redeemCode: e.target.value });
  };

  // For display purposes - count lines (only in add mode)
  const codeCount =
    mode === "add"
      ? formData.redeemCode.split("\n").filter((line) => line.trim().length > 0)
          .length
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-stone-950 border-stone-800 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
        <DialogHeader className="border-b border-stone-800 pb-6">
          <DialogTitle className="text-2xl font-bold text-primary">
            {mode === "edit" ? "Edit Stock" : "Add New Stock"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div>
            <Label className="text-sm font-medium text-primary mb-2 block">
              Product
            </Label>
            <Select
              value={formData.productId}
              onValueChange={(value) =>
                setFormData({ ...formData, productId: value })
              }
            >
              <SelectTrigger className="bg-stone-900/50 border-stone-800 text-primary h-10">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent className="bg-stone-900 border-stone-800">
                {products.map((product) => (
                  <SelectItem
                    key={product._id}
                    value={product._id}
                    className="text-primary"
                  >
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-primary mb-2 block">
              {mode === "add" ? "Redeem Codes" : "Redeem Code"}
            </Label>
            {mode === "add" ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-secondary">
                    {codeCount} code{codeCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <textarea
                  placeholder="Enter redeem codes (one per line): VIP30-001-PQR678"
                  value={formData.redeemCode}
                  onChange={handleCodeChange}
                  className="bg-stone-900/50 border w-full border-stone-800 text-primary placeholder:text-stone-600 rounded-md p-3 min-h-[120px] font-mono text-sm resize-none focus:outline-none focus:border-stone-700 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-600 [&::-webkit-scrollbar-thumb]:rounded-full"
                />
                <p className="text-xs text-secondary mt-2">
                  Paste multiple codes, one per line. Each line will create a
                  separate stock item.
                </p>
              </>
            ) : (
              <>
                <Input
                  placeholder="e.g. VIP30-001-PQR678"
                  value={formData.redeemCode}
                  onChange={(e) =>
                    setFormData({ ...formData, redeemCode: e.target.value })
                  }
                  className="bg-stone-900/50 border-stone-800 text-primary placeholder:text-stone-600 h-10"
                />
                <p className="text-xs text-secondary mt-2">
                  Edit the redeem code for this stock item.
                </p>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 border-t border-stone-800 pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-stone-800 hover:text-secondary text-primary disabled:text-secondary cursor-pointer hover:bg-stone-900/50"
          >
            Cancel
          </Button>
          <Button
            className="bg-primary text-black hover:bg-stone-400 cursor-pointer px-8"
            onClick={handleSubmit}
            disabled={
              isLoading || !formData.productId || !formData.redeemCode.trim()
            }
          >
            {isLoading
              ? "Saving..."
              : mode === "edit"
              ? "Update"
              : `Add ${codeCount} Stock${codeCount !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: DeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border-white/10">
        <AlertDialogTitle className="text-primary">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-secondary">
          {description}
        </AlertDialogDescription>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel disabled={isLoading} className="border-white/10">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
