// app/providers.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface UserData {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: "user" | "admin";
}

interface UserRoleContextType {
  role: "user" | "admin" | null;
  user: UserData | null;
  isLoading: boolean;
  setRole: (role: "user" | "admin" | null) => void;
  setUser: (user: UserData | null) => void;
  refreshAuth: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(
  undefined
);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store", // Don't cache this request
      });

      if (response.status === 401) {
        // Not authenticated - clear everything
        setRole(null);
        setUser(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setRole(data.role === "admin" ? "admin" : "user");
        setUser({
          id: data._id,
          username: data.username,
          email: data.email,
          phoneNumber: data.phoneNumber,
          role: data.role,
        });
      } else {
        // Invalid session - clear everything
        setRole(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth refresh error:", error);
      setRole(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <UserRoleContext.Provider
      value={{ role, user, isLoading, setRole, setUser, refreshAuth }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error("useUserRole must be used within UserRoleProvider");
  }
  return context;
}
