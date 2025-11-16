// lib/db/users.ts
import { UserDocument, UserProfile } from "@/lib/types";
import { MOCK_USERS } from "./mock-data";

export class UserService {
  /**
   * Find user by email
   * Later: Replace with MongoDB query
   */
  static async findByEmail(email: string): Promise<UserDocument | null> {
    return MOCK_USERS.find((user) => user.email === email) || null;
  }

  /**
   * Find user by ID
   * Later: Replace with MongoDB query
   */
  static async findById(id: string): Promise<UserDocument | null> {
    return MOCK_USERS.find((user) => user._id === id) || null;
  }

  /**
   * Find user by username
   * Later: Replace with MongoDB query
   */
  static async findByUsername(username: string): Promise<UserDocument | null> {
    return MOCK_USERS.find((user) => user.username === username) || null;
  }

  /**
   * Login user - returns user profile if credentials match
   * Later: Replace with MongoDB query + password hashing
   */
  static async login(
    email: string,
    password: string
  ): Promise<UserProfile | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    // In real app: use bcrypt.compare(password, user.password)
    if (user.password !== password) {
      return null;
    }

    // Return profile without password
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      joinDate: user.joinDate,
    };
  }

  /**
   * Get all users (for admin)
   * Later: Replace with MongoDB query
   */
  static async getAllUsers(): Promise<UserDocument[]> {
    return MOCK_USERS;
  }

  /**
   * Get all users as profiles (without passwords)
   * Later: Replace with MongoDB query
   */
  static async getAllUserProfiles(): Promise<UserProfile[]> {
    return MOCK_USERS.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      joinDate: user.joinDate,
    }));
  }

  /**
   * Update user role
   * Later: Replace with MongoDB query
   */
  static async updateUserRole(
    id: string,
    role: "admin" | "user"
  ): Promise<UserDocument | null> {
    const index = MOCK_USERS.findIndex((user) => user._id === id);
    if (index === -1) return null;

    MOCK_USERS[index] = {
      ...MOCK_USERS[index],
      role,
      updatedAt: new Date(),
    };
    return MOCK_USERS[index];
  }

  /**
   * Delete user
   * Later: Replace with MongoDB query
   */
  static async deleteUser(id: string): Promise<boolean> {
    const index = MOCK_USERS.findIndex((user) => user._id === id);
    if (index === -1) return false;

    MOCK_USERS.splice(index, 1);
    return true;
  }

  /**
   * Get user statistics
   * Later: Replace with MongoDB aggregation
   */
  static async getUserStats() {
    const totalUsers = MOCK_USERS.length;
    const totalAdmins = MOCK_USERS.filter((u) => u.role === "admin").length;
    const totalRegularUsers = MOCK_USERS.filter((u) => u.role === "user").length;

    return {
      totalUsers,
      totalAdmins,
      totalRegularUsers,
    };
  }
}