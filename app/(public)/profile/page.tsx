"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Edit2,
  Save,
  X,
  Mail,
  User,
  Phone,
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
import { UserDocument } from "@/lib/types";
import { toDate } from "@/lib/utils/date";

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

export default function UserProfilePage() {
  const [user, setUser] = useState<UserDocument | null>(null);
  const [orderGroups, setOrderGroups] = useState<OrderGroupWithExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedPhoneNumber, setEditedPhoneNumber] = useState("");
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0,
    avgRating: "0",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingStates, setRatingStates] = useState<
    Record<string, number | null>
  >({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const ITEMS_PER_PAGE = 10;

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

  // Load Midtrans Snap script on mount
  useEffect(() => {
    const loadSnapScript = () => {
      console.log("📦 Attempting to load Midtrans Snap script...");

      // Check if script is already loaded
      if (window.snap) {
        console.log("✅ Snap already loaded");
        setSnapLoaded(true);
        return;
      }

      // Check if script tag already exists
      if (document.getElementById("midtrans-snap-script")) {
        console.log("⏳ Snap script tag exists, waiting...");
        const checkSnap = setInterval(() => {
          if (window.snap) {
            console.log("✅ Snap loaded via existing script");
            setSnapLoaded(true);
            clearInterval(checkSnap);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkSnap);
          if (!window.snap) {
            console.error("❌ Snap script tag exists but snap not available");
            setSnapLoaded(false);
          }
        }, 3000);

        return;
      }

      // Create and load script
      const script = document.createElement("script");
      script.id = "midtrans-snap-script";
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
      );
      script.async = true;

      script.onload = () => {
        console.log("✅ Midtrans Snap script loaded successfully");
        console.log("   window.snap available:", !!window.snap);

        // Give Midtrans time to initialize
        setTimeout(() => {
          if (window.snap) {
            console.log("✅ Snap is ready!");
            setSnapLoaded(true);
          } else {
            console.warn("⚠️ Snap loaded but not ready yet, retrying...");
            // Retry a few times
            let retries = 3;
            const checkInterval = setInterval(() => {
              if (window.snap) {
                console.log("✅ Snap is now ready!");
                setSnapLoaded(true);
                clearInterval(checkInterval);
              } else if (retries-- <= 0) {
                console.error("❌ Snap failed to initialize");
                clearInterval(checkInterval);
              }
            }, 500);
          }
        }, 500);
      };

      script.onerror = () => {
        console.error("❌ Failed to load Midtrans Snap script");
        setSnapLoaded(false);
      };

      document.head.appendChild(script);
    };

    loadSnapScript();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Fetch user data and order groups
  const fetchData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      console.log("🔄 Fetching data for userId:", userId);

      const [userRes, orderGroupsRes] = await Promise.all([
        fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/order-groups/user/${userId}`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      console.log("User response status:", userRes.status);
      console.log("OrderGroups response status:", orderGroupsRes.status);

      if (!userRes.ok) {
        console.error("Failed to fetch user:", userRes.status);
        throw new Error("Failed to fetch user");
      }

      const userData = await userRes.json();
      console.log("✅ User data:", userData);

      if (userData) {
        setUser(userData);
        setEditedUsername(userData.username);
        setEditedPhoneNumber(userData.phoneNumber);
      }

      if (orderGroupsRes.ok) {
        const orderGroupsData = await orderGroupsRes.json();
        console.log("✅ OrderGroups response:", orderGroupsData);

        if (orderGroupsData.success) {
          console.log(
            "📦 OrderGroups fetched:",
            orderGroupsData.data.orderGroups.length
          );

          const expandedOGs = orderGroupsData.data.orderGroups.map(
            (og: OrderGroupWithDetails) => ({
              ...og,
              isExpanded: false,
            })
          );

          setOrderGroups(expandedOGs);
          setStats(orderGroupsData.data.stats);

          const initialRatings: Record<string, number | null> = {};
          orderGroupsData.data.orderGroups.forEach(
            (og: OrderGroupWithDetails) => {
              initialRatings[og._id?.toString() ?? ""] = og.rating ?? null;
            }
          );
          setRatingStates(initialRatings);
        }
      } else {
        console.error("Failed to fetch order groups:", orderGroupsRes.status);
        const errorData = await orderGroupsRes.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("❌ Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleToggleExpand = (orderGroupId: string) => {
    setOrderGroups((prev) =>
      prev.map((og) =>
        og._id?.toString() === orderGroupId
          ? { ...og, isExpanded: !og.isExpanded }
          : og
      )
    );
  };

  const handleRatingChange = async (
    orderGroupId: string | undefined,
    rating: number
  ) => {
    if (!orderGroupId) return;

    try {
      const response = await fetch(`/api/order-groups/${orderGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) throw new Error("Failed to update rating");

      setRatingStates((prev) => ({
        ...prev,
        [orderGroupId]: rating,
      }));

      const updated = orderGroups.map((og) =>
        og._id?.toString() === orderGroupId ? { ...og, rating } : og
      );
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
      console.error("Failed to update rating:", error);
    }
  };

  const handleRemoveRating = async (orderGroupId: string | undefined) => {
    if (!orderGroupId) return;

    try {
      const response = await fetch(`/api/order-groups/${orderGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: null }),
      });

      if (!response.ok) throw new Error("Failed to remove rating");

      setRatingStates((prev) => ({
        ...prev,
        [orderGroupId]: null,
      }));

      const updated = orderGroups.map((og) =>
        og._id?.toString() === orderGroupId ? { ...og, rating: null } : og
      );
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

  const handleResumePayment = async (orderGroupId: string | undefined) => {
    if (!orderGroupId || !userId) {
      alert("Order ID or User ID not found");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [orderGroupId]: true }));
      console.log("🔄 Resuming payment for order group:", orderGroupId);

      const resumeResponse = await fetch("/api/payment/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderGroupId,
          userId,
        }),
      });

      const resumeData = await resumeResponse.json();

      console.log("📊 Resume response:", {
        status: resumeResponse.status,
        success: resumeData.success,
      });

      if (!resumeResponse.ok) {
        console.error("❌ Failed to resume payment:", resumeData.error);
        alert(`❌ ${resumeData.error || "Failed to resume payment"}`);
        setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        return;
      }

      if (!resumeData.data?.token) {
        console.error("❌ No payment token received");
        alert("Failed to retrieve payment token");
        setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        return;
      }

      console.log("✅ Payment token received");
      console.log("   Token:", resumeData.data.token.substring(0, 20) + "...");
      console.log("   Amount:", resumeData.data.amount);

      // Ensure Snap is loaded
      if (!window.snap) {
        console.error("❌ Midtrans Snap not available");
        console.log("   Attempting to reload Snap script...");

        // Wait a bit more and retry
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!window.snap) {
          alert(
            "Payment system failed to load. Please refresh the page and try again."
          );
          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
          return;
        }
      }

      console.log("🎯 Opening Snap popup to resume payment");

      window.snap.pay(resumeData.data.token, {
        onSuccess: async function (result: any) {
          console.log("✅ Payment success from Midtrans:", result);

          try {
            console.log("💳 Updating order status to completed...");

            const updateResponse = await fetch(
              `/api/order-groups/${orderGroupId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentStatus: "completed",
                  midtransTransactionId: result.transaction_id,
                }),
              }
            );

            const updateData = await updateResponse.json();

            if (!updateResponse.ok) {
              console.warn(
                "⚠️ Failed to update order status:",
                updateData.error
              );
            } else {
              console.log("✅ Order status updated to completed");
            }
          } catch (updateError) {
            console.error("❌ Error updating order status:", updateError);
          }

          await fetchData();
          alert("✅ Payment successful! Your redeem codes are now available.");
          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        },

        onPending: function (result: any) {
          console.log("⏳ Payment pending:", result);
          alert("⏳ Payment is still pending. Please complete it.");
          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        },

        onError: function (result: any) {
          console.error("❌ Payment error:", result);
          alert("❌ Payment failed. Please try again.");
          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        },

        onClose: function () {
          console.log("🚪 Payment popup closed by user");
          setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
        },
      });
    } catch (error) {
      console.error("❌ Failed to resume payment:", error);
      alert("Error resuming payment. Please try again.");
      setActionLoading((prev) => ({ ...prev, [orderGroupId]: false }));
    }
  };

  const handleCancelOrderGroup = async (orderGroupId: string | undefined) => {
    if (!orderGroupId) return;

    if (
      !confirm(
        "Are you sure you want to cancel this order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [orderGroupId]: true }));
      console.log("❌ Cancelling order group:", orderGroupId);

      const response = await fetch(`/api/order-groups/${orderGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "cancelled" }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel order group");
      }

      const { data } = await response.json();
      console.log("✅ Order group cancelled:", data);

      const updated = orderGroups.map((og) =>
        og._id?.toString() === orderGroupId
          ? { ...og, paymentStatus: "cancelled" as const }
          : og
      );
      setOrderGroups(updated);

      await fetchData();
    } catch (error) {
      console.error("❌ Failed to cancel order group:", error);
      alert("Failed to cancel order group. Please try again.");
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
        alert("Failed to copy redeem code");
      });
  };

  const handleSaveUsername = async () => {
    try {
      if (!userId || !editedUsername.trim()) return;

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editedUsername,
          phoneNumber: editedPhoneNumber,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setUser(data);
        setIsEditing(false);

        window.dispatchEvent(new Event("profileUpdated"));
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditedUsername(user.username);
      setEditedPhoneNumber(user.phoneNumber);
    }
    setIsEditing(false);
  };

  if (!userId) {
    return (
      <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
        <p className="text-secondary">Please log in to view your profile.</p>
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
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">My Profile</h1>
          <p className="text-secondary">
            View your account information and order history
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-white/10 hover:bg-stone-800 gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Snap Loading Status */}
      {!snapLoaded && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-300 text-sm">
            ⏳ Loading payment system ({snapLoaded ? "Ready" : "Loading"})... If
            this takes too long, try refreshing the page.
          </p>
        </div>
      )}

      {/* User Information Card */}
      {user && (
        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold text-primary">
              Account Information
            </h2>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-primary text-black hover:bg-stone-400 gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </label>
              {isEditing ? (
                <Input
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="bg-stone-800/30 border-white/10"
                  placeholder="Enter username"
                />
              ) : (
                <p className="text-lg text-primary font-medium">
                  {user.username}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-lg text-primary font-medium">{user.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={editedPhoneNumber}
                  onChange={(e) => setEditedPhoneNumber(e.target.value)}
                  className="bg-stone-800/30 border-white/10"
                  placeholder="Enter phone number"
                  type="tel"
                />
              ) : (
                <p className="text-lg text-primary font-medium">
                  {user.phoneNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member Since
              </label>
              <p className="text-lg text-primary font-medium">
                {toDate(user.joinDate).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-6 border-t border-white/10 mt-6">
              <Button
                onClick={handleSaveUsername}
                className="bg-primary text-black hover:bg-stone-400 gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="border-white/10 hover:bg-stone-800 gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
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

      {/* Order History */}
      <div className="bg-background border border-white/10 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Order History
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
              const isExpanded = orderGroup.isExpanded || false;
              const paidStocks =
                orderGroup.stocks?.filter((s) => s.status === "paid") || [];

              return (
                <div
                  key={ogId}
                  className="border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition"
                >
                  {/* Order Header */}
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

                    <div className="ml-4 flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-secondary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Content */}
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

                      {/* Redeem Codes */}
                      {orderGroup.paymentStatus === "completed" &&
                        paidStocks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-primary mb-3">
                              Redeem Codes ({paidStocks.length})
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-600 [&::-webkit-scrollbar-thumb]:rounded-full px-2">
                              {paidStocks.map((stock, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-stone-800/30 border border-white/10 rounded p-3 hover:border-white/20 transition"
                                >
                                  <code className="text-xs sm:text-sm text-primary font-mono break-all">
                                    {stock.redeemCode}
                                  </code>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyRedeemCode(
                                        stock.redeemCode,
                                        `${ogId}-${idx}`
                                      );
                                    }}
                                    className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded hover:bg-white/10 transition text-xs flex-shrink-0 ml-2"
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
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Status Messages */}
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

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-white/10">
                        {orderGroup.paymentStatus === "pending" && (
                          <>
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
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrderGroup(ogId);
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

      {/* Pagination */}
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
    </div>
  );
}
