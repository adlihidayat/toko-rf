// app/admin/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Clock,
  Phone,
} from "lucide-react";
import { UserService } from "@/lib/db/users";
import { UserDocument, UserProfile } from "@/lib/types";

export default function AdminProfilePage() {
  const [adminUser, setAdminUser] = useState<UserDocument | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserDocument>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch admin user and all users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allUsersData = await UserService.getAllUsers();
        const admin = allUsersData.find((u) => u.role === "admin");

        if (admin) {
          setAdminUser(admin);
          setEditedData(admin);
        }

        const profiles = await UserService.getAllUserProfiles();
        setAllUsers(profiles);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditChange = (field: keyof UserDocument, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!adminUser) return;
    try {
      setAdminUser(editedData as UserDocument);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const handleCancel = () => {
    setEditedData(adminUser || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
        <div className="text-center text-secondary">Loading...</div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
        <div className="text-center text-secondary">No admin user found</div>
      </div>
    );
  }

  return (
    <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 w-full md:w-8/12">
        <h1 className="text-3xl font-bold text-primary mb-2">Admin Profile</h1>
        <p className="text-secondary">
          Manage your admin account information and system settings
        </p>
      </div>

      {/* Main Profile Card */}
      <Card className="bg-stone-900/50 border-white/10 mb-8 w-full md:w-8/12">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5">
          <div>
            <CardTitle className="text-primary text-2xl">
              Account Information
            </CardTitle>
            <CardDescription>Your admin account details</CardDescription>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-primary text-black hover:bg-stone-400 gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* User ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                User ID
              </label>
              {isEditing ? (
                <Input
                  value={editedData._id || ""}
                  disabled
                  className="bg-stone-800/30 border-white/10"
                />
              ) : (
                <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                  {adminUser._id}
                </div>
              )}
              <p className="text-xs text-secondary">
                Unique identifier (cannot be changed)
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Users className="w-4 h-4" />
                Username
              </label>
              {isEditing ? (
                <Input
                  value={editedData.username || ""}
                  onChange={(e) => handleEditChange("username", e.target.value)}
                  className="bg-stone-800/30 border-white/10"
                  placeholder="Enter username"
                />
              ) : (
                <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                  {adminUser.username}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              {isEditing ? (
                <Input
                  value={editedData.email || ""}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  className="bg-stone-800/30 border-white/10"
                  placeholder="Enter email"
                  type="email"
                />
              ) : (
                <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                  {adminUser.email}
                </div>
              )}
            </div>

            {/* Phone Number - NEW */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={editedData.phoneNumber || ""}
                  onChange={(e) =>
                    handleEditChange("phoneNumber", e.target.value)
                  }
                  className="bg-stone-800/30 border-white/10"
                  placeholder="Enter phone number"
                  type="tel"
                />
              ) : (
                <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                  {adminUser.phoneNumber}
                </div>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role
              </label>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-sm py-1">
                  {adminUser.role.charAt(0).toUpperCase() +
                    adminUser.role.slice(1)}
                </Badge>
                <span className="text-secondary text-sm">
                  Full system access
                </span>
              </div>
            </div>

            {/* Join Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Join Date
              </label>
              <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                {adminUser.joinDate.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-secondary">
                {adminUser.joinDate.toLocaleTimeString("id-ID")}
              </p>
            </div>

            {/* Created At */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Account Created
              </label>
              <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                {adminUser.createdAt.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-secondary">
                {adminUser.createdAt.toLocaleTimeString("id-ID")}
              </p>
            </div>

            {/* Last Updated */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last Updated
              </label>
              <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                {adminUser.updatedAt.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-secondary">
                {adminUser.updatedAt.toLocaleTimeString("id-ID")}
              </p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button
                  onClick={handleSave}
                  className="bg-primary text-black hover:bg-stone-400 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-white/10 hover:bg-stone-800 gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to your profile?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="border-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className="bg-primary text-black hover:bg-stone-400"
            >
              Save Changes
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
