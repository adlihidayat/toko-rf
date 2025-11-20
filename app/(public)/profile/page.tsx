"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Edit2,
  Save,
  X,
  Mail,
  User,
  Phone,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { UserDocument } from "@/lib/types";
import { toDate } from "@/lib/utils/date";
import {
  SuccessDialog,
  ErrorDialog,
  InfoDialog,
} from "@/components/shared/dialog";

export default function UserProfilePage() {
  const [user, setUser] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedPhoneNumber, setEditedPhoneNumber] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

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
  const [infoDialog, setInfoDialog] = useState({
    open: false,
    title: "",
    description: "",
  });

  // Extract userId from cookies
  useEffect(() => {
    const cookies = document.cookie.split(";");
    const userIdCookie = cookies
      .find((cookie) => cookie.trim().startsWith("user-id="))
      ?.split("=")[1];
    setUserId(userIdCookie || null);
  }, []);

  // Fetch user data
  const fetchData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const userData = await response.json();

      if (userData) {
        setUser(userData);
        setEditedUsername(userData.username);
        setEditedPhoneNumber(userData.phoneNumber);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setErrorDialog({
        open: true,
        title: "Error Loading Profile",
        description:
          "Failed to load your profile information. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleSaveUsername = async () => {
    try {
      if (!userId || !editedUsername.trim()) {
        setErrorDialog({
          open: true,
          title: "Invalid Input",
          description: "Username cannot be empty.",
        });
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editedUsername,
          phoneNumber: editedPhoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const { data } = await response.json();
      setUser(data);
      setIsEditing(false);

      setSuccessDialog({
        open: true,
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });

      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      console.error("Failed to update profile:", error);
      setErrorDialog({
        open: true,
        title: "Update Failed",
        description: "Unable to update your profile. Please try again.",
      });
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

  return (
    <div className="pt-10 pb-10 px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">My Profile</h1>
          <p className="text-secondary">
            View and manage your account information
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

      {/* User Information Card */}
      {user && (
        <div className="bg-stone-900/50 border border-white/10 rounded-lg p-6 pb-10 mb-8">
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

            {/* Member Since */}
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

      {/* Dialogs */}
      <SuccessDialog
        open={successDialog.open}
        onOpenChange={(open) => setSuccessDialog((prev) => ({ ...prev, open }))}
        title={successDialog.title}
        description={successDialog.description}
        actionLabel="Done"
      />

      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}
        title={errorDialog.title}
        description={errorDialog.description}
        actionLabel="Close"
      />

      <InfoDialog
        open={infoDialog.open}
        onOpenChange={(open) => setInfoDialog((prev) => ({ ...prev, open }))}
        title={infoDialog.title}
        description={infoDialog.description}
        actionLabel="Got it"
      />
    </div>
  );
}
