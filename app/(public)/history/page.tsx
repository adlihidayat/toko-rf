// app/(public)/history/page.tsx - TYPE FIXES (Top section only)

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ShoppingCart,
  DollarSign,
  Star,
  Calendar,
  RefreshCw,
  CreditCard,
  Trash2,
  Loader,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { OrderGroupWithDetails } from "@/lib/db/services/order-group";
import { toDate } from "@/lib/utils/date";
import {
  SuccessDialog,
  ErrorDialog,
  WarningDialog,
  DangerDialog,
} from "@/components/shared/dialog";
import { fetchWithAuth } from "@/lib/utils/auth";
import { useOrderGroups } from "@/lib/utils/useOrderGroups";

// ✅ FIX 1: Properly extend OrderGroupWithDetails to include isExpanded
interface OrderGroupWithExpanded extends OrderGroupWithDetails {
  isExpanded?: boolean;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: any) => void;
    };
  }
}

interface Stats {
  totalPurchases: number;
  totalSpent: number;
  avgRating: string;
}

export default function OrderHistoryPage() {
  const {
    orderGroups: hookOrderGroups,
    stats: hookStats,
    loading,
    error: hookError,
    userId,
    refetch,
  } = useOrderGroups();

  // Local UI state
  const [orderGroups, setOrderGroups] = useState<OrderGroupWithExpanded[]>([]);
  const [stats, setStats] = useState(hookStats);
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingStates, setRatingStates] = useState<
    Record<string, number | null>
  >({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState<Record<string, boolean>>(
    {}
  );

  const ITEMS_PER_PAGE = 10;

  // Dialog states
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    description: "",
  });
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: "",
    description: "",
  });
  const [warningDialog, setWarningDialog] = useState({
    open: false,
    title: "",
    description: "",
    orderGroupId: "",
  });
  const [dangerDialog, setDangerDialog] = useState({
    open: false,
    title: "",
    description: "",
    orderGroupId: "",
  });

  useEffect(() => {
    // ✅ FIX: Properly type cast the expanded orders array
    const expandedOGs: OrderGroupWithExpanded[] = hookOrderGroups.map((og) => ({
      ...og,
      isExpanded: false,
    })) as unknown as OrderGroupWithExpanded[];

    setOrderGroups(expandedOGs);
    setStats(hookStats);

    const initialRatings: Record<string, number | null> = {};
    hookOrderGroups.forEach((og) => {
      initialRatings[og._id?.toString() ?? ""] = og.rating ?? null;
    });
    setRatingStates(initialRatings);
  }, [hookOrderGroups, hookStats]);

  // Load Midtrans Snap script
  useEffect(() => {
    const loadSnapScript = () => {
      if (window.snap) {
        setSnapLoaded(true);
        return;
      }

      if (document.getElementById("midtrans-snap-script")) {
        const checkSnap = setInterval(() => {
          if (window.snap) {
            setSnapLoaded(true);
            clearInterval(checkSnap);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkSnap);
          if (!window.snap) {
            setSnapLoaded(false);
          }
        }, 3000);

        return;
      }

      const script = document.createElement("script");
      script.id = "midtrans-snap-script";
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
      );
      script.async = true;

      script.onload = () => {
        setTimeout(() => {
          if (window.snap) {
            setSnapLoaded(true);
          } else {
            let retries = 3;
            const checkInterval = setInterval(() => {
              if (window.snap) {
                setSnapLoaded(true);
                clearInterval(checkInterval);
              } else if (retries-- <= 0) {
                clearInterval(checkInterval);
              }
            }, 500);
          }
        }, 500);
      };

      script.onerror = () => {
        setSnapLoaded(false);
      };

      document.head.appendChild(script);
    };

    loadSnapScript();
  }, []);

  // Auto-check pending orders
  useEffect(() => {
    if (!userId) return;

    const checkPendingOrders = async () => {
      const pendingOrders = orderGroups.filter(
        (og) => og.paymentStatus === "pending"
      );

      for (const order of pendingOrders) {
        const orderId = order._id?.toString() ?? "";

        try {
          console.log(`🔄 Auto-checking pending order: ${orderId}`);

          const response = await fetchWithAuth(
            `/api/order-groups/${orderId}/check-status`,
            { method: "POST" }
          );

          const data = await response.json();

          if (data.success && data.statusChanged) {
            console.log(`✅ Status changed to: ${data.paymentStatus}`);

            setOrderGroups((prev) =>
              prev.map((og) => {
                if (og._id?.toString() === orderId) {
                  return {
                    ...og,
                    paymentStatus: data.paymentStatus,
                  } as OrderGroupWithExpanded;
                }
                return og;
              })
            );

            if (data.paymentStatus === "completed") {
              setSuccessDialog({
                open: true,
                title: "Payment Confirmed",
                description: `Order ${orderId.slice(
                  0,
                  8
                )}... has been completed!`,
              });
            }
          }
        } catch (error) {
          console.error(`Error auto-checking order ${orderId}:`, error);
        }
      }
    };

    checkPendingOrders();
    const interval = setInterval(checkPendingOrders, 30000);
    return () => clearInterval(interval);
  }, [userId, orderGroups.length]);

  const handleToggleExpand = async (orderGroupId: string) => {
    const orderGroup = orderGroups.find(
      (og) => og._id?.toString() === orderGroupId
    );

    // If already expanded, just collapse
    if (orderGroup?.isExpanded) {
      setOrderGroups((prev) =>
        prev.map((og) => {
          if (og._id?.toString() === orderGroupId) {
            return { ...og, isExpanded: false } as OrderGroupWithExpanded;
          }
          return og;
        })
      );
      return;
    }

    // ✅ ONLY for completed orders AND codes not yet loaded
    if (
      orderGroup?.paymentStatus === "completed" &&
      !orderGroup?.redeemCodes?.length
    ) {
      try {
        console.log(
          `🔐 Securely fetching redeem codes for order: ${orderGroupId}`
        );

        const response = await fetchWithAuth(
          `/api/order-groups/${orderGroupId}/redeem-codes`,
          {
            method: "GET",
            // fetchWithAuth handles x-user-id header automatically
          }
        );

        const data = await response.json();

        // ✅ Handle payment not completed (402)
        if (response.status === 402) {
          console.warn("⚠️ Payment status changed:", data.error);

          setErrorDialog({
            open: true,
            title: "Payment Status Changed",
            description:
              data.error || "Cannot access redeem codes - payment incomplete",
          });

          // Refresh status
          await refetch();
          return;
        }

        // ✅ Handle unauthorized (404)
        if (response.status === 404) {
          console.error("❌ Order not accessible");

          setErrorDialog({
            open: true,
            title: "Not Found",
            description: "This order is not accessible",
          });
          return;
        }

        // ✅ Handle server error
        if (!response.ok) {
          console.error("❌ Failed to fetch redeem codes:", data.error);

          setErrorDialog({
            open: true,
            title: "Error",
            description: data.error || "Failed to load redeem codes",
          });
          return;
        }

        // ✅ Success - load codes securely
        console.log(
          `✅ Successfully loaded ${data.data.redeemCodes.length} redeem codes`
        );

        setOrderGroups((prev) =>
          prev.map((og) => {
            if (og._id?.toString() === orderGroupId) {
              return {
                ...og,
                isExpanded: true,
                redeemCodes: data.data.redeemCodes,
              } as OrderGroupWithExpanded;
            }
            return og;
          })
        );
      } catch (error) {
        console.error("❌ Network error fetching redeem codes:", error);

        setErrorDialog({
          open: true,
          title: "Error",
          description: "Failed to fetch redeem codes - check your connection",
        });
      }
    } else {
      // For pending orders or already expanded - just toggle
      setOrderGroups((prev) =>
        prev.map((og) => {
          if (og._id?.toString() === orderGroupId) {
            return {
              ...og,
              isExpanded: !og.isExpanded,
            } as OrderGroupWithExpanded;
          }
          return og;
        })
      );
    }
  };

  const handleRefreshStatus = async (orderGroupId: string) => {
    console.log(`🔄 Manually refreshing status for order: ${orderGroupId}`);
    setCheckingStatus((prev) => ({ ...prev, [orderGroupId]: true }));

    try {
      const response = await fetchWithAuth(
        `/api/order-groups/${orderGroupId}/check-status`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!data.success) {
        setErrorDialog({
          open: true,
          title: "Error",
          description: data.error || "Failed to check status",
        });
        return;
      }

      setOrderGroups((prev) =>
        prev.map((og) => {
          if (og._id?.toString() === orderGroupId) {
            return {
              ...og,
              paymentStatus: data.paymentStatus,
            } as OrderGroupWithExpanded;
          }
          return og;
        })
      );

      if (data.statusChanged) {
        setSuccessDialog({
          open: true,
          title: "Status Updated",
          description: `Payment status: ${data.paymentStatus}`,
        });
      } else {
        setWarningDialog({
          open: true,
          title: "No Change",
          description: `Status unchanged: ${data.paymentStatus}`,
          orderGroupId: "",
        });
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
      setErrorDialog({
        open: true,
        title: "Error",
        description: "Failed to refresh status",
      });
    } finally {
      setCheckingStatus((prev) => ({ ...prev, [orderGroupId]: false }));
    }
  };

  const handleResumePayment = async (orderGroupId: string | undefined) => {
    if (!orderGroupId || !userId) {
      setErrorDialog({
        open: true,
        title: "Error",
        description: "Order ID or User ID not found",
      });
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [orderGroupId]: true }));

      console.log("🔄 Checking current status before resume...");

      const statusResponse = await fetchWithAuth(
        `/api/order-groups/${orderGroupId}/check-status`,
        { method: "POST" }
      );

      const statusData = await statusResponse.json();

      if (statusData.success && statusData.paymentStatus === "completed") {
        setSuccessDialog({
          open: true,
          title: "Already Completed",
          description: "This payment has already been completed!",
        });
        setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        return;
      }

      if (statusData.success && statusData.paymentStatus === "failed") {
        setErrorDialog({
          open: true,
          title: "Payment Failed",
          description:
            "Previous payment failed. Please start a new transaction.",
        });
        setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        return;
      }

      console.log("⏳ Retrieving existing payment token...");

      const resumeResponse = await fetch("/api/payment/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderGroupId,
          userId,
        }),
      });

      const resumeData = await resumeResponse.json();

      if (!resumeResponse.ok) {
        throw new Error(resumeData.error || "Failed to resume payment");
      }

      if (!resumeData.data?.token) {
        throw new Error("Failed to retrieve payment token");
      }

      console.log("✅ Payment token retrieved (existing):", {
        isExistingPayment: resumeData.data.isExistingPayment,
      });

      if (!window.snap) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!window.snap) {
          throw new Error(
            "Payment system failed to load. Please refresh the page and try again."
          );
        }
      }

      window.snap.pay(resumeData.data.token, {
        onSuccess: async function (result: any) {
          console.log("✅ Payment completed:", result);

          const checkResponse = await fetchWithAuth(
            `/api/order-groups/${orderGroupId}/check-status`,
            { method: "POST" }
          );

          const checkData = await checkResponse.json();

          if (checkData.success) {
            setOrderGroups((prev) =>
              prev.map((og) => {
                if (og._id?.toString() === orderGroupId) {
                  return {
                    ...og,
                    paymentStatus: checkData.paymentStatus,
                  } as OrderGroupWithExpanded;
                }
                return og;
              })
            );

            setSuccessDialog({
              open: true,
              title: "Payment Successful",
              description:
                "Your payment has been processed. Your redeem codes are now available.",
            });
          }

          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        },

        onPending: function (result: any) {
          console.log("⏳ Payment pending:", result);
          setWarningDialog({
            open: true,
            title: "Payment Pending",
            description:
              "Your payment is still being processed. Please complete it.",
            orderGroupId: "",
          });
          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        },

        onError: function (result: any) {
          console.error("❌ Payment error:", result);
          setErrorDialog({
            open: true,
            title: "Payment Failed",
            description:
              "Your payment could not be processed. Please try again.",
          });
          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        },

        onClose: function () {
          console.log("🚪 Payment modal closed");
          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        },
      });
    } catch (error) {
      console.error("Failed to resume payment:", error);
      setErrorDialog({
        open: true,
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error resuming payment",
      });
      setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
    }
  };

  const handleRatingChange = async (
    orderGroupId: string | undefined,
    rating: number
  ) => {
    if (!orderGroupId) return;

    try {
      const response = await fetchWithAuth(
        `/api/order-groups/${orderGroupId}`,
        {
          method: "PUT",
          body: JSON.stringify({ rating }),
        }
      );

      if (!response.ok) throw new Error("Failed to update rating");

      setRatingStates((prev) => ({
        ...prev,
        [orderGroupId]: rating,
      }));

      const updated: OrderGroupWithExpanded[] = orderGroups.map((og) => {
        if (og._id?.toString() === orderGroupId) {
          return { ...og, rating } as OrderGroupWithExpanded;
        }
        return og;
      });
      setOrderGroups(updated);

      const ratedOGs = updated.filter(
        (og) => og.rating !== null && og.paymentStatus === "completed"
      );
      const avgRating =
        ratedOGs.length > 0
          ? (
              ratedOGs.reduce((sum, og) => sum + (og.rating || 0), 0) /
              ratedOGs.length
            ).toFixed(1)
          : "0";
      setStats((prev) => ({ ...prev, avgRating }));

      setSuccessDialog({
        open: true,
        title: "Rating Updated",
        description: "Thank you for rating this order!",
      });
    } catch (error) {
      console.error("Failed to update rating:", error);
      setErrorDialog({
        open: true,
        title: "Error",
        description: "Failed to update rating. Please try again.",
      });
    }
  };

  const handleRemoveRating = async (orderGroupId: string | undefined) => {
    if (!orderGroupId) return;

    try {
      const response = await fetchWithAuth(
        `/api/order-groups/${orderGroupId}`,
        {
          method: "PUT",
          body: JSON.stringify({ rating: null }),
        }
      );

      if (!response.ok) throw new Error("Failed to remove rating");

      setRatingStates((prev) => ({
        ...prev,
        [orderGroupId]: null,
      }));

      const updated: OrderGroupWithExpanded[] = orderGroups.map((og) => {
        if (og._id?.toString() === orderGroupId) {
          return { ...og, rating: null } as OrderGroupWithExpanded;
        }
        return og;
      });
      setOrderGroups(updated);

      const ratedOGs = updated.filter(
        (og) => og.rating !== null && og.paymentStatus === "completed"
      );
      const avgRating =
        ratedOGs.length > 0
          ? (
              ratedOGs.reduce((sum, og) => sum + (og.rating || 0), 0) /
              ratedOGs.length
            ).toFixed(1)
          : "0";
      setStats((prev) => ({ ...prev, avgRating }));
    } catch (error) {
      console.error("Failed to remove rating:", error);
    }
  };

  const handleCancelOrderGroup = async (orderGroupId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [orderGroupId]: true }));

      const response = await fetchWithAuth(
        `/api/order-groups/${orderGroupId}`,
        {
          method: "PUT",
          body: JSON.stringify({ paymentStatus: "cancelled" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel order group");
      }

      const updated: OrderGroupWithExpanded[] = orderGroups.map((og) => {
        if (og._id?.toString() === orderGroupId) {
          return {
            ...og,
            paymentStatus: "cancelled" as const,
          } as OrderGroupWithExpanded;
        }
        return og;
      });
      setOrderGroups(updated);

      setSuccessDialog({
        open: true,
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
      });

      await refetch();
    } catch (error) {
      console.error("Failed to cancel order group:", error);
      setErrorDialog({
        open: true,
        title: "Error",
        description: "Failed to cancel order. Please try again.",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
    }
  };

  const handleCopyRedeemCode = (code: string, orderGroupId: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopiedId(orderGroupId + "-" + code);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        setErrorDialog({
          open: true,
          title: "Copy Failed",
          description: "Failed to copy redeem code",
        });
      });
  };

  if (!userId) {
    return (
      <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
        <p className="text-secondary">
          Please log in to view your order history.
        </p>
      </div>
    );
  }

  if (hookError) {
    return (
      <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{hookError}</p>
          <Button
            onClick={() => refetch()}
            className="mt-4 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(orderGroups.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = orderGroups.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
      {/* ============ HEADER ============ */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Order History
          </h1>
          <p className="text-secondary">
            View your complete purchase history and transaction details
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-white/10 hover:bg-stone-800 gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      {/* ============ SNAP LOADING STATUS ============ */}
      {!snapLoaded && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-300 text-sm">
            ⏳ Loading payment system... If this takes too long, try refreshing
            the page.
          </p>
        </div>
      )}

      {/* ============ STATS CARDS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-primary">
                {stats.totalPurchases}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded bg-blue-500/20">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-secondary text-sm">Completed order groups</p>
        </div>

        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-primary">
                Rp {stats.totalSpent.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded bg-green-500/20">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-secondary text-sm">Total amount paid</p>
        </div>

        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-primary">
                {stats.avgRating}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded bg-yellow-500/20">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-secondary text-sm">From your reviews</p>
        </div>
      </div>

      {/* ============ ORDER HISTORY TABLE ============ */}
      <div className="bg-background border border-white/10 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Transactions
          </h2>
          <p className="text-secondary text-sm mt-1">
            Your complete order history ({orderGroups.length} total)
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-secondary">Loading...</div>
        ) : orderGroups.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            No orders yet. Visit the products page to make your first order!
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {paginatedData.map((orderGroup) => {
              const ogId = orderGroup._id?.toString() ?? "";
              const createdDate = toDate(orderGroup.createdAt);
              const isActionLoading = actionLoading[ogId] || false;
              const isCheckingStatus = checkingStatus[ogId] || false;
              const isExpanded = orderGroup.isExpanded || false;
              const paidStocks =
                orderGroup.stocks?.filter((s) => s.status === "paid") || [];

              return (
                <div
                  key={ogId}
                  className="border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition"
                >
                  {/* ============ ORDER HEADER (CLICKABLE) ============ */}
                  <div
                    className="p-4 bg-stone-900/30 cursor-pointer hover:bg-stone-900/50 transition flex items-center justify-between"
                    onClick={() => handleToggleExpand(ogId)}
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-secondary mb-1">Product</p>
                        <p className="text-sm font-medium text-primary">
                          {orderGroup.productName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary mb-1">Quantity</p>
                        <p className="text-sm font-medium text-primary">
                          {orderGroup.quantity} item
                          {orderGroup.quantity > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="hidden lg:block">
                        <p className="text-xs text-secondary mb-1">
                          Total Paid
                        </p>
                        <p className="text-sm font-medium text-primary">
                          Rp {orderGroup.totalPaid.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="hidden lg:block">
                        <p className="text-xs text-secondary mb-1">Date</p>
                        <p className="text-sm font-medium text-primary">
                          {createdDate.toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary mb-1">Status</p>
                        <Badge
                          className={`text-xs ${
                            orderGroup.paymentStatus === "completed"
                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                              : orderGroup.paymentStatus === "pending"
                              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                              : orderGroup.paymentStatus === "cancelled"
                              ? "bg-gray-500/20 text-gray-300 border-gray-500/30"
                              : "bg-red-500/20 text-red-300 border-red-500/30"
                          }`}
                        >
                          {orderGroup.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="ml-4 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-secondary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                  </div>

                  {/* ============ EXPANDABLE CONTENT ============ */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 bg-stone-950/50 space-y-4">
                      {/* Mobile: Show total and date */}
                      <div className="lg:hidden grid grid-cols-2 gap-4 pb-4 border-b border-white/10">
                        <div>
                          <p className="text-xs text-secondary mb-1">
                            Total Paid
                          </p>
                          <p className="text-sm font-medium text-primary">
                            Rp {orderGroup.totalPaid.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary mb-1">Date</p>
                          <p className="text-sm font-medium text-primary">
                            {createdDate.toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* ============ REDEEM CODES (For Completed Orders) ============ */}
                      {orderGroup.paymentStatus === "completed" && (
                        <>
                          {orderGroup.redeemCodes &&
                          orderGroup.redeemCodes.length > 0 ? (
                            <div>
                              <h4 className="text-sm font-semibold text-primary mb-3">
                                Redeem Codes ({orderGroup.redeemCodes.length})
                              </h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-600 [&::-webkit-scrollbar-thumb]:rounded-full px-2">
                                {orderGroup.redeemCodes.map(
                                  (code: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between bg-stone-800/30 border border-white/10 rounded p-3 hover:border-white/20 transition"
                                    >
                                      <code className="text-xs sm:text-sm text-primary font-mono break-all">
                                        {code}
                                      </code>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyRedeemCode(
                                            code,
                                            `${ogId}-${idx}`
                                          );
                                        }}
                                        className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded hover:bg-white/10 transition text-xs shrink-0 ml-2"
                                        title="Copy redeem code"
                                      >
                                        {copiedId === `${ogId}-${idx}` ? (
                                          <>
                                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                                            <span className="text-green-400 hidden sm:inline">
                                              Copied
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                                            <span className="text-secondary hidden sm:inline">
                                              Copy
                                            </span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                              <p className="text-xs sm:text-sm text-yellow-300">
                                ⏳ Loading redeem codes...
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* ============ STATUS MESSAGES ============ */}
                      {orderGroup.paymentStatus === "pending" && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                          <p className="text-xs sm:text-sm text-yellow-300">
                            ⏳ This order is awaiting payment. Complete the
                            payment to receive your redeem codes.
                          </p>
                        </div>
                      )}

                      {orderGroup.paymentStatus === "cancelled" && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                          <p className="text-xs sm:text-sm text-red-300">
                            ❌ This order has been cancelled. All items have
                            been released back to inventory.
                          </p>
                        </div>
                      )}

                      {/* ============ ACTION BUTTONS ============ */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-white/10">
                        {/* PENDING ORDERS: Continue Payment & Cancel */}
                        {orderGroup.paymentStatus === "pending" && (
                          <>
                            {/* Refresh Status Button */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshStatus(ogId);
                              }}
                              disabled={isCheckingStatus}
                              variant="outline"
                              className="flex-1 h-9 text-xs sm:text-sm border-white/10 hover:border-[#00BCA8]/50 gap-1"
                            >
                              {isCheckingStatus ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              <span>Refresh Status</span>
                            </Button>

                            {/* Continue Payment Button */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResumePayment(ogId);
                              }}
                              disabled={isActionLoading}
                              className="flex-1 h-9 text-xs sm:text-sm bg-primary text-black hover:bg-primary/70 gap-1"
                            >
                              {isActionLoading ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <CreditCard className="w-3 h-3" />
                              )}
                              <span>Continue Payment</span>
                            </Button>

                            {/* Cancel Order Button */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDangerDialog({
                                  open: true,
                                  title: "Cancel Order",
                                  description:
                                    "Are you sure you want to cancel this order? This action cannot be undone.",
                                  orderGroupId: ogId,
                                });
                              }}
                              disabled={isActionLoading}
                              className="flex-1 h-9 text-xs sm:text-sm bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 gap-1"
                            >
                              {isActionLoading ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              <span>Cancel Order</span>
                            </Button>
                          </>
                        )}

                        {/* COMPLETED ORDERS: Rating */}
                        {orderGroup.paymentStatus === "completed" && (
                          <div className="w-full">
                            <p className="text-xs text-secondary mb-3">
                              Rate this order:
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRatingChange(ogId, i + 1);
                                    }}
                                    className="focus:outline-none transition hover:scale-110"
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        i < (ratingStates[ogId] || 0)
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-500 hover:text-yellow-400"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              {ratingStates[ogId] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveRating(ogId);
                                  }}
                                  className="h-6 px-2 text-xs text-secondary hover:text-red-400 hover:bg-red-500/10"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ PAGINATION ============ */}
      {paginatedData.length > 0 && totalPages > 1 && (
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

      {/* ============ DIALOGS ============ */}
      <SuccessDialog
        open={successDialog.open}
        onOpenChange={(open: boolean) =>
          setSuccessDialog((prev) => ({ ...prev, open }))
        }
        title={successDialog.title}
        description={successDialog.description}
        actionLabel="Done"
      />

      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open: boolean) =>
          setErrorDialog((prev) => ({ ...prev, open }))
        }
        title={errorDialog.title}
        description={errorDialog.description}
        actionLabel="Close"
      />

      <WarningDialog
        open={warningDialog.open}
        onOpenChange={(open: boolean) =>
          setWarningDialog((prev) => ({ ...prev, open }))
        }
        title={warningDialog.title}
        description={warningDialog.description}
        cancelLabel="Close"
        confirmLabel="Retry"
        onConfirm={() => {
          setWarningDialog((prev) => ({ ...prev, open: false }));
        }}
      />

      <DangerDialog
        open={dangerDialog.open}
        onOpenChange={(open: boolean) =>
          setDangerDialog((prev) => ({ ...prev, open }))
        }
        title={dangerDialog.title}
        description={dangerDialog.description}
        cancelLabel="Keep Order"
        confirmLabel="Cancel Order"
        isLoading={actionLoading[dangerDialog.orderGroupId] || false}
        onConfirm={() => {
          if (dangerDialog.orderGroupId) {
            handleCancelOrderGroup(dangerDialog.orderGroupId);
            setDangerDialog((prev) => ({ ...prev, open: false }));
          }
        }}
      />
    </div>
  );
}
