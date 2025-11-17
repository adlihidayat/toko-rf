// app/(public)/checkout/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ShoppingCart,
  Loader,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ProductDocument } from "@/lib/types";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState<ProductDocument | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [purchaseIds, setPurchaseIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Extract userId from cookies
  useEffect(() => {
    const cookies = document.cookie.split(";");
    const userIdCookie = cookies
      .find((cookie) => cookie.trim().startsWith("user-id="))
      ?.split("=")[1];
    setUserId(userIdCookie || null);
    console.log("UserId from cookie:", userIdCookie);
  }, []);

  // Fetch product on mount
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        router.push("/products");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${productId}`);
        const { data, success, error: apiError } = await response.json();

        if (!success || !data) {
          setError(apiError || "Product not found");
          router.push("/products");
          return;
        }

        setProduct(data);
        setQuantity(data.minimumPurchase);
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setError("Failed to load product");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleQuantityChange = (value: number) => {
    const min = product?.minimumPurchase || 1;
    if (value >= min) {
      setQuantity(value);
    }
  };

  const calculateTotal = () => {
    return product ? product.price * quantity : 0;
  };

  const handlePayNow = async () => {
    if (!product || !userId) {
      setError("User ID not found. Please log in.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Create pending purchases and reserve stocks atomically
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId: product._id,
          quantity,
          totalPaid: calculateTotal(),
        }),
      });

      const { data, success, error: apiError } = await response.json();

      if (!success) {
        setError(apiError || "Payment processing failed");
        return;
      }

      // Extract purchase IDs
      const ids = data.purchases.map((p: any) => p._id);
      setPurchaseIds(ids);

      // Generate QR code with concatenated purchase IDs
      const qrData = ids.join(",");
      setQrCode(
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          qrData
        )}`
      );
      setShowQR(true);
    } catch (error) {
      console.error("Failed to process payment:", error);
      setError("Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletePayment = async () => {
    try {
      setProcessing(true);
      setError(null);

      if (purchaseIds.length === 0) {
        setError("Purchase IDs not found");
        return;
      }

      // Update all purchase statuses to completed
      const updatePromises = purchaseIds.map((purchaseId) =>
        fetch(`/api/purchase/${purchaseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "completed" }),
        })
      );

      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map((r) => r.json()));

      // Check if all updates succeeded
      const allSuccessful = results.every((r) => r.success);

      if (!allSuccessful) {
        setError("Failed to complete some payments");
        return;
      }

      // Show success message
      setSuccess(true);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Failed to complete payment:", error);
      setError("Failed to complete payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-primary md:px-24">
        <section className="py-20 px-8 pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-secondary">Loading product...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-primary md:px-24">
        <section className="py-20 px-8 pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-secondary">Product not found</p>
            <Button
              onClick={() => router.push("/products")}
              className="mt-6 bg-linear-to-r from-[#00BCA8] to-[#00E19D] text-black font-bold hover:opacity-90"
            >
              Back to Products
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-primary md:px-24">
      <section className="pb-20 px-8 pt-10">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          {!success && (
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mb-8 border-white/10 hover:bg-stone-800 hover:text-primary cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-8 p-4 bg-green-900/20 border border-green-500/30 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-medium">
                  Payment Successful!
                </p>
                <p className="text-green-300/80 text-sm">
                  {purchaseIds.length} item{purchaseIds.length !== 1 ? "s" : ""}{" "}
                  added to your history. Redirecting...
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6 relative">
              <span className="px-3.5 py-1.5 bg-linear-to-r to-[#00E19D] from-[#009AB2] rounded-full text-background z-10 font-bold">
                Checkout
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-primary mb-4">
              Complete Your Purchase
            </h1>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Review your order and complete payment to receive your product
            </p>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Info */}
                  <div className="border border-white/10 rounded-lg p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-primary mb-2">
                          {product.name}
                        </h3>
                        <p className="text-secondary text-sm">
                          {product.description}
                        </p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        In Stock
                      </Badge>
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-secondary text-sm mb-1">
                          Unit Price
                        </p>
                        <p className="text-2xl font-bold text-[#00BCA8]">
                          Rp {product.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Section */}
                  <div className="border border-white/10 rounded-lg p-6">
                    <label className="text-sm font-medium text-primary block mb-4">
                      Quantity
                    </label>
                    <p className="text-xs text-secondary mb-3">
                      Minimum purchase: {product.minimumPurchase} item
                      {product.minimumPurchase > 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          handleQuantityChange(parseInt(e.target.value) || 1)
                        }
                        className="bg-stone-800/30 border-white/10 text-center w-20 h-10"
                        min={product.minimumPurchase}
                        disabled={showQR || success}
                      />
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="border border-white/10 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-primary mb-4">
                      Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-secondary">CPU</p>
                        <p className="text-sm text-primary">
                          {product.cpuCore}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary">Android</p>
                        <p className="text-sm text-primary">
                          {product.android}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary">RAM</p>
                        <p className="text-sm text-primary">{product.ram}</p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary">ROM</p>
                        <p className="text-sm text-primary">{product.rom}</p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary">Processor</p>
                        <p className="text-sm text-primary">
                          {product.processor}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary">Bit</p>
                        <p className="text-sm text-primary">{product.bit}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Summary & Payment */}
            <div>
              <Card className="bg-stone-900/50 border-white/10 sticky top-20">
                <CardHeader>
                  <CardTitle className="text-primary">Order Total</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Unit Price</span>
                      <span className="text-primary font-medium">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Quantity</span>
                      <span className="text-primary font-medium">
                        × {quantity}
                      </span>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="flex justify-between">
                      <span className="font-medium text-primary">Total</span>
                      <span className="text-2xl font-bold text-[#00BCA8]">
                        Rp {calculateTotal().toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Payment Button */}
                  {!showQR ? (
                    <Button
                      onClick={handlePayNow}
                      disabled={processing || success}
                      className="w-full bg-linear-to-r from-[#00BCA8] to-[#00E19D] text-black font-bold hover:opacity-90 py-6 rounded-lg disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Pay Now"
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="border border-white/10 rounded-lg p-4 text-center bg-white/5">
                        <img
                          src={qrCode}
                          alt="Payment QR Code"
                          className="w-full"
                        />
                      </div>
                      <p className="text-xs text-secondary text-center">
                        Scan QR code to complete payment
                      </p>
                      <Button
                        onClick={handleCompletePayment}
                        disabled={processing}
                        className="w-full bg-linear-to-r from-[#00BCA8] to-[#00E19D] text-black font-bold hover:opacity-90 py-6 rounded-lg disabled:opacity-50"
                      >
                        {processing ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Completing...
                          </>
                        ) : (
                          "Complete & Go Home"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Security Info */}
                  <div className="bg-stone-800/30 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-secondary text-center">
                      🔒 Your payment is secure and encrypted
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-primary md:px-24">
          <section className="py-20 px-8 pt-20">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-secondary">Loading...</p>
            </div>
          </section>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
