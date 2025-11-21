// app/(public)/checkout/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, Loader, AlertCircle } from "lucide-react";
import { ProductDocument } from "@/lib/types";
import Script from "next/script";
import {
  SuccessDialog,
  ErrorDialog,
  InfoDialog,
} from "@/components/shared/dialog";
import { fetchWithAuth } from "@/lib/utils/auth";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: any) => void;
    };
  }
}

const USE_SANDBOX = true;
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
const SNAP_URL = USE_SANDBOX
  ? "https://app.sandbox.midtrans.com/snap/snap.js"
  : "https://app.midtrans.com/snap/snap.js";

interface DialogState {
  type: "success" | "error" | "info" | null;
  title: string;
  description: string;
}

interface ResumedOrder {
  orderId: string;
  midtransOrderId: string;
  token: string;
  quantity: number;
  totalPaid: number;
  expiresAt: string;
  timeRemaining: number;
  isResumed: boolean;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState<ProductDocument | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    type: null,
    title: "",
    description: "",
  });

  // Resume payment states
  const [resumedOrder, setResumedOrder] = useState<ResumedOrder | null>(null);
  const [checkingResume, setCheckingResume] = useState(false);
  const [showResumeOption, setShowResumeOption] = useState(false);

  // Extract userId from cookies
  useEffect(() => {
    const cookies = document.cookie.split(";");
    const userIdCookie = cookies
      .find((cookie) => cookie.trim().startsWith("user-id="))
      ?.split("=")[1];
    setUserId(userIdCookie || null);
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
          setDialog({
            type: "error",
            title: "Product Not Found",
            description: apiError || "The product could not be loaded.",
          });
          setTimeout(() => router.push("/products"), 2000);
          return;
        }

        setProduct(data);
        setQuantity(data.minimumPurchase);
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setDialog({
          type: "error",
          title: "Load Error",
          description: "Failed to load the product. Redirecting...",
        });
        setTimeout(() => router.push("/products"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  // Check for pending/resumed order on mount
  useEffect(() => {
    const checkForPendingOrder = async () => {
      if (!productId || !userId || checkingResume) return;

      try {
        setCheckingResume(true);
        console.log("🔍 Checking for pending order...");

        const response = await fetch("/api/payment/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, userId }),
        });

        const { success, data, error } = await response.json();

        if (success && data) {
          console.log("✅ Found pending order - resume available");
          setResumedOrder(data);
          setShowResumeOption(true);
        } else {
          console.log("ℹ️ No pending order:", error);
          setResumedOrder(null);
          setShowResumeOption(false);
        }
      } catch (error) {
        console.error("Error checking pending order:", error);
        setResumedOrder(null);
        setShowResumeOption(false);
      } finally {
        setCheckingResume(false);
      }
    };

    checkForPendingOrder();
  }, [productId, userId]);

  const handleQuantityChange = (value: number) => {
    const min = product?.minimumPurchase || 1;
    if (value >= min) {
      setQuantity(value);
    }
  };

  const calculateTotal = () => {
    return product ? product.price * quantity : 0;
  };

  // Handle resuming existing payment
  const handleResumePayment = async () => {
    if (!resumedOrder || !snapLoaded) {
      setDialog({
        type: "error",
        title: "Error",
        description: "Payment system not ready. Please try again.",
      });
      return;
    }

    try {
      setProcessing(true);
      console.log("🔄 Resuming payment with token:", resumedOrder.token);

      if (window.snap) {
        window.snap.pay(resumedOrder.token, {
          onSuccess: async function (result: any) {
            console.log("✅ Payment success from Midtrans:", result);

            try {
              const confirmResponse = await fetchWithAuth(
                `/api/payment/confirm`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    orderGroupId: resumedOrder.orderId,
                    midtransTransactionId: result.transaction_id,
                    paymentStatus: "completed",
                  }),
                }
              );

              if (confirmResponse.ok) {
                console.log("✅ Order confirmed");
              }
            } catch (confirmError) {
              console.error("❌ Error confirming payment:", confirmError);
            }

            setDialog({
              type: "success",
              title: "Payment Successful",
              description: "Your payment has been completed!",
            });

            setTimeout(() => {
              router.push("/history?tab=history&payment=success");
            }, 2000);
          },

          onPending: function (result: any) {
            console.log("⏳ Payment pending:", result);
            setDialog({
              type: "info",
              title: "Payment Pending",
              description: "Your payment is still pending.",
            });
            setProcessing(false);
          },

          onError: function (result: any) {
            console.error("❌ Payment error:", result);
            setDialog({
              type: "error",
              title: "Payment Failed",
              description: "Payment failed. Please try again.",
            });
            setProcessing(false);
          },

          onClose: function () {
            console.log("🚪 Payment popup closed");
            setProcessing(false);
          },
        });
      }
    } catch (error) {
      console.error("❌ Error resuming payment:", error);
      setDialog({
        type: "error",
        title: "Error",
        description: "Failed to resume payment. Please try again.",
      });
      setProcessing(false);
    }
  };

  // Handle new payment
  const handlePayNow = async () => {
    if (!product || !userId) {
      setDialog({
        type: "error",
        title: "Missing Information",
        description: "User ID not found. Please log in.",
      });
      return;
    }

    if (!snapLoaded) {
      setDialog({
        type: "error",
        title: "Payment System",
        description: "Payment system is loading. Please wait...",
      });
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      console.log("🔄 Creating payment transaction...");

      const response = await fetch("/api/payment/create", {
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
        console.error("❌ Payment creation failed:", apiError);
        setDialog({
          type: "error",
          title: "Payment Error",
          description: apiError || "Payment processing failed",
        });
        setProcessing(false);
        return;
      }

      console.log("✅ Payment token received");

      // ✅ STORE THE TOKEN - This is important for resume!
      const snapToken = data.token;

      if (window.snap) {
        window.snap.pay(snapToken, {
          // ✅ Use the token
          onSuccess: async function (result: any) {
            console.log("✅ Payment success from Midtrans:", result);

            try {
              const confirmResponse = await fetchWithAuth(
                `/api/payment/confirm`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    tempMidtransOrderId: data.tempMidtransOrderId,
                    tempStockIds: data.tempStockIds,
                    productId: data.productId,
                    quantity: data.quantity,
                    totalPaid: data.totalPaid,
                    userId: data.userId,
                    snapToken: snapToken, // ✅ PASS THE TOKEN
                    midtransTransactionId: result.transaction_id,
                    paymentStatus: "completed",
                  }),
                }
              );

              if (!confirmResponse.ok) {
                console.warn("⚠️ Failed to confirm payment");
              } else {
                console.log("✅ Order created and payment confirmed");
              }
            } catch (confirmError) {
              console.error("❌ Error confirming payment:", confirmError);
            }

            setDialog({
              type: "success",
              title: "Payment Successful",
              description:
                "Your payment has been completed! Redirecting to your history...",
            });

            setTimeout(() => {
              router.push("/history?tab=history&payment=success");
            }, 2000);
          },

          onPending: async function (result: any) {
            console.log("⏳ Payment pending:", result);

            const confirmPending = async () => {
              try {
                const confirmResponse = await fetchWithAuth(
                  `/api/payment/confirm`,
                  {
                    method: "POST",
                    body: JSON.stringify({
                      tempMidtransOrderId: data.tempMidtransOrderId,
                      tempStockIds: data.tempStockIds,
                      productId: data.productId,
                      quantity: data.quantity,
                      totalPaid: data.totalPaid,
                      userId: data.userId,
                      snapToken: data.token, // ✅ PASS THE TOKEN
                      midtransTransactionId: result.transaction_id,
                      paymentStatus: "pending",
                    }),
                  }
                );

                if (!confirmResponse.ok) {
                  console.warn("⚠️ Failed to create pending order");
                } else {
                  console.log(
                    "✅ Order created with pending status - stocks reserved"
                  );
                }
              } catch (error) {
                console.error("❌ Error creating pending order:", error);
              }
            };

            confirmPending();

            setDialog({
              type: "info",
              title: "Payment Pending",
              description:
                "Your payment is still pending. You will be redirected to your history.",
            });

            setTimeout(() => {
              router.push("/history");
            }, 2000);
          },

          onError: function (result: any) {
            console.error("❌ Payment error:", result);

            const releaseReservedStocks = async (stockIds: string[]) => {
              console.log("🔄 Releasing reserved stocks:", stockIds);

              try {
                const response = await fetch("/api/stocks/release", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stockIds }),
                });

                if (response.ok) {
                  console.log("✅ Stocks released successfully");
                } else {
                  console.warn("⚠️ Failed to release stocks via API");
                }
              } catch (error) {
                console.error("❌ Error releasing stocks:", error);
              }
            };

            releaseReservedStocks(data.tempStockIds);

            setDialog({
              type: "error",
              title: "Payment Failed",
              description: "Payment failed. Stocks have been released.",
            });
            setProcessing(false);
          },

          onClose: function () {
            console.log("🚪 Payment popup closed by user");

            const releaseReservedStocks = async (stockIds: string[]) => {
              console.log("🔄 Releasing reserved stocks:", stockIds);

              try {
                const response = await fetch("/api/stocks/release", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stockIds }),
                });

                if (response.ok) {
                  console.log("✅ Stocks released successfully");
                } else {
                  console.warn("⚠️ Failed to release stocks via API");
                }
              } catch (error) {
                console.error("❌ Error releasing stocks:", error);
              }
            };

            releaseReservedStocks(data.tempStockIds);

            setProcessing(false);
            setDialog({
              type: "error",
              title: "Payment Cancelled",
              description: "Payment was cancelled. Stocks have been released.",
            });
          },
        });
      } else {
        console.error("❌ Snap not available");
        setDialog({
          type: "error",
          title: "Payment System Error",
          description: "Payment system not available",
        });
        setProcessing(false);
      }
    } catch (error) {
      console.error("❌ Failed to process payment:", error);
      setDialog({
        type: "error",
        title: "Error",
        description: "Payment processing failed. Please try again.",
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-primary md:px-24">
        <section className="py-20 px-8 pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
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
    <>
      {/* Dialog System */}
      {dialog.type === "success" && (
        <SuccessDialog
          open={dialog.type === "success"}
          onOpenChange={() =>
            setDialog({ type: null, title: "", description: "" })
          }
          title={dialog.title}
          description={dialog.description}
        />
      )}

      {dialog.type === "error" && (
        <ErrorDialog
          open={dialog.type === "error"}
          onOpenChange={() =>
            setDialog({ type: null, title: "", description: "" })
          }
          title={dialog.title}
          description={dialog.description}
        />
      )}

      {dialog.type === "info" && (
        <InfoDialog
          open={dialog.type === "info"}
          onOpenChange={() =>
            setDialog({ type: null, title: "", description: "" })
          }
          title={dialog.title}
          description={dialog.description}
        />
      )}

      {/* Load Midtrans Snap.js */}
      <Script
        src={SNAP_URL}
        data-client-key={MIDTRANS_CLIENT_KEY}
        onLoad={() => {
          console.log("✅ Midtrans Snap loaded (SANDBOX MODE)");
          setSnapLoaded(true);
        }}
        onError={() => {
          console.error("❌ Failed to load Midtrans Snap");
          setDialog({
            type: "error",
            title: "Script Error",
            description: "Failed to load payment system",
          });
        }}
        strategy="afterInteractive"
      />

      <main className="min-h-screen bg-black text-primary md:px-24">
        <section className="pb-20 px-8 pt-10">
          <div className="max-w-4xl mx-auto">
            {/* Sandbox Mode Indicator */}
            {USE_SANDBOX && (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm text-center">
                  🧪 <strong>SANDBOX MODE</strong> - Use test payment methods
                </p>
              </div>
            )}

            {/* Back Button */}
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mb-8 border-white/10 hover:bg-stone-800 hover:text-primary cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

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
                Review your order and complete payment securely with Midtrans
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
                          disabled={processing}
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
                    {/* RESUME PAYMENT OPTION */}
                    {showResumeOption && resumedOrder && (
                      <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                        <p className="text-sm text-blue-300 mb-3">
                          💳 You have an incomplete payment for this product!
                        </p>
                        <p className="text-xs text-blue-200 mb-3">
                          Created at:{" "}
                          {new Date(resumedOrder.expiresAt).toLocaleString()}
                          <br />
                          Time remaining: {resumedOrder.timeRemaining} seconds
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleResumePayment}
                            disabled={processing || !snapLoaded}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2"
                          >
                            {processing ? (
                              <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Resuming...
                              </>
                            ) : (
                              "↩️ Resume Payment"
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setResumedOrder(null);
                              setShowResumeOption(false);
                            }}
                            variant="outline"
                            className="flex-1 border-blue-500/50 text-blue-300"
                          >
                            Start Fresh
                          </Button>
                        </div>
                      </div>
                    )}

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
                    {!showResumeOption || !resumedOrder ? (
                      <Button
                        onClick={handlePayNow}
                        disabled={processing || !snapLoaded}
                        className="w-full bg-linear-to-r from-[#00BCA8] to-[#00E19D] text-black font-bold hover:opacity-90 py-6 rounded-lg disabled:opacity-50"
                      >
                        {processing ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : !snapLoaded ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Loading Payment...
                          </>
                        ) : (
                          `Pay with Midtrans ${USE_SANDBOX ? "(Sandbox)" : ""}`
                        )}
                      </Button>
                    ) : null}

                    {/* Security Info */}
                    <div className="bg-stone-800/30 border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-secondary text-center">
                        🔒 Secured by Midtrans Payment Gateway
                        {USE_SANDBOX && (
                          <span className="block mt-1 text-yellow-400">
                            Test Mode - No real charges
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-primary md:px-24">
          <section className="py-20 px-8 pt-20">
            <div className="max-w-4xl mx-auto text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
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
