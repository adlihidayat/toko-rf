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
} from "lucide-react";
import { PurchaseWithDetails, UserDocument } from "@/lib/types";
import { toDate, ensureString } from "@/lib/utils/date";

export default function UserProfilePage() {
  const [user, setUser] = useState<UserDocument | null>(null);
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedPhoneNumber, setEditedPhoneNumber] = useState("");
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalPurchases: 0,
    avgRating: "0",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingStates, setRatingStates] = useState<
    Record<string, number | null>
  >({});
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

  // Fetch user data and purchases
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, purchasesRes] = await Promise.all([
          fetch("/api/auth/me", {
            credentials: "include",
          }),
          fetch(`/api/purchase/user/${userId}`, {
            credentials: "include",
          }),
        ]);

        if (!userRes.ok) throw new Error("Failed to fetch user");

        const userData = await userRes.json();
        const purchasesData = await purchasesRes.json();

        if (userData) {
          setUser(userData);
          setEditedUsername(userData.username);
          setEditedPhoneNumber(userData.phoneNumber);
        }

        if (purchasesData.success) {
          console.log("Purchases fetched:", purchasesData.data);
          setPurchases(purchasesData.data.purchases);
          setStats(purchasesData.data.stats);

          const initialRatings: Record<string, number | null> = {};
          purchasesData.data.purchases.forEach(
            (purchase: PurchaseWithDetails) => {
              initialRatings[purchase._id ?? ""] = purchase.rating ?? null;
            }
          );
          setRatingStates(initialRatings);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleRatingChange = async (
    purchaseId: string | undefined,
    rating: number
  ) => {
    if (!purchaseId) return;

    try {
      const response = await fetch(`/api/purchase/${purchaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) throw new Error("Failed to update rating");

      setRatingStates((prev) => ({
        ...prev,
        [purchaseId]: rating,
      }));

      const updated = purchases.map((p) =>
        p._id === purchaseId ? { ...p, rating } : p
      );
      setPurchases(updated);

      const ratedPurchases = updated.filter((p) => p.rating !== null);
      const avgRating =
        ratedPurchases.length > 0
          ? (
              ratedPurchases.reduce((sum, p) => sum + (p.rating || 0), 0) /
              ratedPurchases.length
            ).toFixed(1)
          : "0";
      setStats((prev) => ({ ...prev, avgRating }));
    } catch (error) {
      console.error("Failed to update rating:", error);
    }
  };

  const handleRemoveRating = async (purchaseId: string | undefined) => {
    if (!purchaseId) return;

    try {
      const response = await fetch(`/api/purchase/${purchaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: null }),
      });

      if (!response.ok) throw new Error("Failed to remove rating");

      setRatingStates((prev) => ({
        ...prev,
        [purchaseId]: null,
      }));

      const updated = purchases.map((p) =>
        p._id === purchaseId ? { ...p, rating: null } : p
      );
      setPurchases(updated);

      const ratedPurchases = updated.filter((p) => p.rating !== null);
      const avgRating =
        ratedPurchases.length > 0
          ? (
              ratedPurchases.reduce((sum, p) => sum + (p.rating || 0), 0) /
              ratedPurchases.length
            ).toFixed(1)
          : "0";
      setStats((prev) => ({ ...prev, avgRating }));
    } catch (error) {
      console.error("Failed to remove rating:", error);
    }
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

        // ADD THIS LINE - Dispatch event to notify navbar
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

  const totalPages = Math.ceil(purchases.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = purchases.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">My Profile</h1>
        <p className="text-secondary">
          View your account information and purchase history
        </p>
      </div>

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
            {/* Username */}
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

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
                {isEditing && (
                  <p className="text-xs text-secondary">(cannot be changed)</p>
                )}
              </label>
              <p className="text-lg text-primary font-medium">{user.email}</p>
            </div>

            {/* Phone Number */}
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

            {/* Join Date */}
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

          {/* Edit Actions */}
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
              <p className="text-secondary text-sm mb-1">Total Purchased</p>
              <p className="text-3xl font-bold text-primary">
                {stats.totalPurchases}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded bg-blue-500/20">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-secondary text-sm">Items purchased</p>
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

      {/* Transaction History */}
      <div className="bg-background border border-white/10 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Transaction History
          </h2>
          <p className="text-secondary text-sm mt-1">
            Your purchase history with ratings
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-secondary">Loading...</div>
        ) : purchases.length === 0 ? (
          <div className="p-8 text-center text-secondary">No purchases yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-primary">Product</TableHead>
                <TableHead className="text-primary">Redeem Code</TableHead>
                <TableHead className="text-primary">Amount</TableHead>
                <TableHead className="text-primary">Date</TableHead>
                <TableHead className="text-primary">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((purchase) => {
                const purchaseId = purchase._id ?? "";
                const createdDate = toDate(purchase.createdAt);
                const redeemCode = ensureString(purchase.redeemCode);

                return (
                  <TableRow
                    key={purchaseId}
                    className="border-white/10 hover:bg-white/5 transition"
                  >
                    <TableCell className="font-medium text-primary">
                      {purchase.productName}
                    </TableCell>
                    <TableCell className="text-secondary text-sm font-mono">
                      {redeemCode}
                    </TableCell>
                    <TableCell className="text-primary">
                      Rp {purchase.totalPaid.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-secondary text-sm">
                      {createdDate.toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ratingStates[purchaseId] ? (
                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() =>
                                    handleRatingChange(purchaseId, i + 1)
                                  }
                                  className="focus:outline-none transition"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      i < (ratingStates[purchaseId] || 0)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-500"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRating(purchaseId)}
                              className="h-6 px-2 text-xs text-secondary hover:text-red-400 hover:bg-red-500/10"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() =>
                                    handleRatingChange(purchaseId, i + 1)
                                  }
                                  className="focus:outline-none transition hover:scale-110"
                                >
                                  <Star className="w-4 h-4 text-gray-500 hover:text-yellow-400" />
                                </button>
                              ))}
                            </div>
                            <span className="text-secondary text-xs">
                              Rate this
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
    </div>
  );
}
