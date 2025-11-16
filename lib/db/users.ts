import { UserDocument, UserProfile } from "@/lib/types";
import { MOCK_USERS } from "./mock-data";

export class UserService {
  static async findByEmail(email: string): Promise<UserDocument | null> {
    return MOCK_USERS.find((user) => user.email === email) || null;
  }

  static async findById(id: string): Promise<UserDocument | null> {
    return MOCK_USERS.find((user) => user._id === id) || null;
  }

  static async findByUsername(username: string): Promise<UserDocument | null> {
    return MOCK_USERS.find((user) => user.username === username) || null;
  }

  static async login(
    email: string,
    password: string
  ): Promise<UserProfile | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    if (user.password !== password) {
      return null;
    }

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber, // NEW
      role: user.role,
      joinDate: user.joinDate,
    };
  }

  static async getAllUsers(): Promise<UserDocument[]> {
    return MOCK_USERS;
  }

  static async getAllUserProfiles(): Promise<UserProfile[]> {
    return MOCK_USERS.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber, // NEW
      role: user.role,
      joinDate: user.joinDate,
    }));
  }

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

  // NEW: Update user phone number
  static async updatePhoneNumber(
    id: string,
    phoneNumber: string
  ): Promise<UserDocument | null> {
    const index = MOCK_USERS.findIndex((user) => user._id === id);
    if (index === -1) return null;

    MOCK_USERS[index] = {
      ...MOCK_USERS[index],
      phoneNumber,
      updatedAt: new Date(),
    };
    return MOCK_USERS[index];
  }

  static async deleteUser(id: string): Promise<boolean> {
    const index = MOCK_USERS.findIndex((user) => user._id === id);
    if (index === -1) return false;

    MOCK_USERS.splice(index, 1);
    return true;
  }

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
