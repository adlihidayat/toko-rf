// components/admin/UserDialogs.tsx
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
import { Badge } from "@/components/ui/badge";
import { CustomButton } from "@/components/ui/custom-button";
import { UserDocument, PurchaseWithDetails } from "@/lib/types";
import { Star } from "lucide-react";
import { toDate } from "@/lib/utils/date";

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (role: "admin" | "user") => Promise<void>;
  user: UserDocument | null;
  isLoading?: boolean;
}

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDocument | null;
  userPurchases: PurchaseWithDetails[];
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  isLoading?: boolean;
}

export function UserEditDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
  isLoading = false,
}: UserEditDialogProps) {
  const [role, setRole] = useState<"admin" | "user">("user");
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setRole(user.role);
    }
  }, [open, user]);

  const handleSubmit = async () => {
    setLocalLoading(true);
    try {
      await onSubmit(role);
    } finally {
      setLocalLoading(false);
    }
  };

  const isProcessing = isLoading || localLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-stone-950 border-stone-800">
        <DialogHeader className="border-b border-stone-800 pb-6">
          <DialogTitle className="text-2xl font-bold text-primary">
            Edit User Role
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div>
            <p className="text-sm text-secondary mb-2">Username</p>
            <p className="text-lg font-medium text-primary">{user?.username}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-primary mb-3 block">
              User Role
            </p>
            <Select
              value={role}
              onValueChange={(value: any) => setRole(value)}
              disabled={isProcessing}
            >
              <SelectTrigger className="bg-stone-900/50 border-stone-800 text-primary h-10">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-stone-900 border-stone-800">
                <SelectItem
                  value="user"
                  className="text-primary focus:bg-stone-700 focus:text-white"
                >
                  User
                </SelectItem>
                <SelectItem
                  value="admin"
                  className="text-primary focus:bg-stone-700 focus:text-white"
                >
                  Admin
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-3 border-t border-stone-800 pt-6">
          <div className="flex gap-3 w-5/12">
            <CustomButton
              variant="black"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="white"
              onClick={handleSubmit}
              disabled={isProcessing || role === user?.role}
              className="flex-1"
            >
              {isProcessing ? "Saving..." : "Update"}
            </CustomButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
  userPurchases,
}: UserDetailDialogProps) {
  const totalSpent = userPurchases.reduce((sum, p) => sum + p.totalPaid, 0);
  const totalTransactions = userPurchases.length;

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-stone-950 border-stone-800 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
        <DialogHeader className="border-b border-stone-800 pb-6">
          <DialogTitle className="text-2xl font-bold text-primary">
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-primary">
              User Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary mb-1">User ID</p>
                <p className="font-mono text-sm text-primary">{user._id}</p>
              </div>
              <div>
                <p className="text-xs text-secondary mb-1">Username</p>
                <p className="text-sm text-primary font-medium">
                  {user.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary mb-1">Email</p>
                <p className="text-sm text-primary">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-secondary mb-1">Role</p>
                <Badge
                  className={
                    user.role === "admin"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30 w-fit"
                      : "bg-purple-500/20 text-purple-300 border-purple-500/30 w-fit"
                  }
                >
                  {user.role === "admin" ? "Admin" : "User"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary mb-1">Phone Number</p>
                <p className="text-sm text-primary">{user.phoneNumber}</p>
              </div>
              <div>
                <p className="text-xs text-secondary mb-1">Join Date</p>
                <p className="text-sm text-primary">
                  {toDate(user.joinDate).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-secondary mb-1">Account Created</p>
              <p className="text-sm text-primary">
                {toDate(user.createdAt).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>

          <div className="border-t border-stone-800"></div>

          {/* Purchase Statistics */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-primary">
              Purchase Statistics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-4">
                <p className="text-xs text-secondary mb-2">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-primary">
                  {totalTransactions}
                </p>
              </div>
              <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-4">
                <p className="text-xs text-secondary mb-2">Total Spent</p>
                <p className="text-2xl font-bold text-primary">
                  Rp {totalSpent.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          {userPurchases.length > 0 && (
            <>
              <div className="border-t border-stone-800"></div>
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-primary">
                  Purchase History
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {userPurchases.map((purchase) => (
                    <div
                      key={purchase._id}
                      className="bg-stone-900/50 border border-stone-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-primary">
                            {purchase.productName}
                          </p>
                          <p className="text-xs text-secondary font-mono">
                            {purchase.redeemCode}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-primary">
                          Rp {purchase.totalPaid.toLocaleString("id-ID")}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-secondary">
                          {toDate(purchase.createdAt).toLocaleDateString(
                            "id-ID"
                          )}
                        </p>
                        {purchase.rating !== null &&
                        purchase.rating !== undefined ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-primary">
                              {purchase.rating}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-500">
                            Not rated
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {userPurchases.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-secondary">
                No purchase history available
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 border-t border-stone-800 pt-6">
          <CustomButton
            variant="white"
            onClick={() => onOpenChange(false)}
            className="w-auto"
          >
            Close
          </CustomButton>
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
  isLoading = false,
}: DeleteDialogProps) {
  const [localLoading, setLocalLoading] = useState(false);

  const handleConfirm = async () => {
    setLocalLoading(true);
    try {
      await onConfirm();
    } finally {
      setLocalLoading(false);
    }
  };

  const isProcessing = isLoading || localLoading;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-stone-900 border-white/10">
        <AlertDialogTitle className="text-primary">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-secondary">
          {description}
        </AlertDialogDescription>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel
            disabled={isProcessing}
            className="border-white/10 text-primary hover:text-primary hover:bg-stone-800 "
          >
            Cancel
          </AlertDialogCancel>
          <CustomButton
            variant="white"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-auto bg-red-500 text-primary hover:bg-red-600"
          >
            {isProcessing ? "Deleting..." : "Delete"}
          </CustomButton>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
