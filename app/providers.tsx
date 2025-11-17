// app/providers.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface UserRoleContextType {
  role: "user" | "admin" | null;
  isLoading: boolean;
  setRole: (role: "user" | "admin" | null) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(
  undefined
);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include", // IMPORTANT: Include cookies in request
        });

        // 401 is expected for non-logged-in users
        if (response.status === 401) {
          setRole(null);
          setIsLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setRole(data.role === "admin" ? "admin" : "user");
        } else {
          setRole(null);
        }
      } catch (error) {
        // Silently fail - this is expected when user is not logged in
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return (
    <UserRoleContext.Provider value={{ role, isLoading, setRole }}>
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
