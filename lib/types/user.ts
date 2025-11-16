// lib/types/user.ts
export type UserRole = "user" | "admin";

export interface UserDocument {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  joinDate: Date;
}

