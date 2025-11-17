// app/admin/users-management/page.tsx
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
import { TrendingUp, Eye, Edit2, Trash2, Ellipsis, X } from "lucide-react";
import { UserDocument, PurchaseWithDetails } from "@/lib/types";
import {
  UserEditDialog,
  UserDetailDialog,
  DeleteDialog,
} from "@/components/admin/UserDialogs";
import { toDate } from "@/lib/utils/date";

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Error/Success states
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersRes, purchasesRes] = await Promise.all([
          fetch("/api/users", {
            credentials: "include",
          }),
          fetch("/api/purchase", {
            credentials: "include",
          }),
        ]);

        if (!usersRes.ok || !purchasesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const usersData = await usersRes.json();
        const purchasesData = await purchasesRes.json();

        if (usersData.success) setUsers(usersData.data);
        if (purchasesData.success) setPurchases(purchasesData.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter data - search by username, email, or phone number
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate stats
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalRegularUsers = users.filter((u) => u.role === "user").length;
  const totalTransactions = purchases.length;

  // Handlers
  const handleEditClick = (user: UserDocument) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleDetailClick = (user: UserDocument) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleDeleteClick = (user: UserDocument) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const onEditSubmit = async (role: "admin" | "user") => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!selectedUser) {
        showError("No user selected");
        return;
      }

      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Failed to update user");
        return;
      }

      setUsers(users.map((u) => (u._id === data.data._id ? data.data : u)));
      setIsEditOpen(false);
      showSuccess(`User role updated to ${role}`);
    } catch (err) {
      console.error("Failed to update user:", err);
      showError("Failed to update user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteConfirm = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!selectedUser) {
        showError("No user selected");
        return;
      }

      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Failed to delete user");
        return;
      }

      setUsers(users.filter((u) => u._id !== selectedUser._id));
      setPurchases(purchases.filter((p) => p.userId !== selectedUser._id));
      setIsDeleteOpen(false);
      showSuccess("User deleted successfully");
    } catch (err) {
      console.error("Failed to delete user:", err);
      showError("Failed to delete user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          User Management
        </h1>
        <p className="text-secondary">Manage users, roles, and permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-primary">{totalUsers}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              +8.5%
            </div>
          </div>
          <p className="text-secondary text-sm">All registered users</p>
        </div>

        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Administrators</p>
              <p className="text-3xl font-bold text-primary">{totalAdmins}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              +2%
            </div>
          </div>
          <p className="text-secondary text-sm">Admin users</p>
        </div>

        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Regular Users</p>
              <p className="text-3xl font-bold text-primary">
                {totalRegularUsers}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              +6.5%
            </div>
          </div>
          <p className="text-secondary text-sm">Regular users</p>
        </div>

        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-secondary text-sm mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-primary">
                {totalTransactions}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              +12%
            </div>
          </div>
          <p className="text-secondary text-sm">Completed transactions</p>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-sm z-50 flex items-start justify-between gap-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500/20 border border-green-500/30 rounded-lg p-4 max-w-sm z-50 flex items-start justify-between gap-4">
          <p className="text-sm text-green-400">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-400 hover:text-green-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by username, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-stone-900/30 border-white/10"
          />
        </div>
        <div className="text-sm text-secondary self-center">
          Found {filteredUsers.length} user
          {filteredUsers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-white/10 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary">Loading...</div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            {searchTerm ? "No users found" : "No users yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-primary">User ID</TableHead>
                  <TableHead className="text-primary">Username</TableHead>
                  <TableHead className="text-primary">Email</TableHead>
                  <TableHead className="text-primary">Phone</TableHead>
                  <TableHead className="text-primary">Role</TableHead>
                  <TableHead className="text-primary">Join Date</TableHead>
                  <TableHead className="text-primary text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow
                    key={user._id}
                    className="border-white/10 hover:bg-white/5 transition"
                  >
                    <TableCell className="text-secondary font-mono text-sm">
                      {user._id}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-secondary">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-secondary">
                        <span>{user.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        }
                      >
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-secondary">
                      {toDate(user.joinDate).toLocaleDateString("id-ID")}
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
                        <DropdownMenuContent
                          align="end"
                          className="bg-stone-900 border-stone-800"
                        >
                          <DropdownMenuItem
                            onClick={() => handleDetailClick(user)}
                            className="text-primary hover:bg-stone-800 hover:text-primary cursor-pointer focus:bg-stone-800 focus:text-primary"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(user)}
                            className="text-primary hover:bg-stone-800 hover:text-primary cursor-pointer focus:bg-stone-800 focus:text-primary"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-400 hover:bg-stone-800 hover:text-red-300 cursor-pointer focus:bg-stone-800 focus:text-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginatedUsers.length > 0 && (
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
      <UserEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={onEditSubmit}
        user={selectedUser}
        isLoading={isSubmitting}
      />

      <UserDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        user={selectedUser}
        userPurchases={
          selectedUser
            ? purchases.filter((p) => p.userId === selectedUser._id)
            : []
        }
      />

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={onDeleteConfirm}
        title="Delete User"
        description={
          selectedUser
            ? `Are you sure you want to delete user "${selectedUser.username}"? All associated data will be removed. This action cannot be undone.`
            : ""
        }
        isLoading={isSubmitting}
      />
    </div>
  );
}
