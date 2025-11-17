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
import { UserDocument } from "@/lib/types";
import { toDate } from "@/lib/utils/date";

export default function AdminProfilePage() {
  const [adminUser, setAdminUser] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserDocument>>({});
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Fetch admin user
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch admin");

        const admin = await response.json();
        setAdminUser(admin);
        setEditedData(admin);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load profile data");
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
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSave = async () => {
    if (!adminUser) return;

    // Validate before saving
    if (editedData.username && editedData.username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (editedData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedData.email)) {
        setError("Invalid email format");
        return;
      }
    }

    if (editedData.phoneNumber && editedData.phoneNumber.trim().length < 10) {
      setError("Phone number must be at least 10 digits");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/users/${adminUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editedData.username,
          email: editedData.email,
          phoneNumber: editedData.phoneNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save changes");
      }

      if (result.success && result.data) {
        setAdminUser(result.data);
        setEditedData(result.data);
        setIsEditing(false);
        setError("");

        // Dispatch custom event to notify navbar
        window.dispatchEvent(new Event("profileUpdated"));
      }
    } catch (error: any) {
      console.error("Failed to save changes:", error);
      setError(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(adminUser || {});
    setIsEditing(false);
    setError("");
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

      {/* Error Alert */}
      {error && (
        <div className="mb-4 w-full md:w-8/12 bg-red-500/10 border border-red-500/30 rounded p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

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
              <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                {adminUser._id}
              </div>
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

            {/* Phone Number */}
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
                {toDate(adminUser.joinDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-secondary">
                {toDate(adminUser.joinDate).toLocaleTimeString("id-ID")}
              </p>
            </div>

            {/* Created At */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Account Created
              </label>
              <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                {toDate(adminUser.createdAt).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-secondary">
                {toDate(adminUser.createdAt).toLocaleTimeString("id-ID")}
              </p>
            </div>

            {/* Last Updated */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last Updated
              </label>
              <div className="bg-stone-800/30 border border-white/10 rounded px-3 py-2 text-primary">
                {toDate(adminUser.updatedAt).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-secondary">
                {toDate(adminUser.updatedAt).toLocaleTimeString("id-ID")}
              </p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-black hover:bg-stone-400 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={saving}
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
    </div>
  );
}
