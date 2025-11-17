// lib/db/services/users.ts
import connectDB from "../mongodb";
import User from "../models/User";
import { UserDocument, UserProfile } from "@/lib/types";

export class UserService {
  static async findByEmail(email: string): Promise<UserDocument | null> {
    await connectDB();
    return await User.findOne({ email }).select("-password").lean();
  }

  static async findById(id: string): Promise<UserDocument | null> {
    await connectDB();
    return await User.findById(id).select("-password").lean();
  }

  static async findByUsername(username: string): Promise<UserDocument | null> {
    await connectDB();
    return await User.findOne({ username }).select("-password").lean();
  }

  static async login(
    email: string,
    password: string
  ): Promise<UserProfile | null> {
    await connectDB();
    const user = await User.findOne({ email }).lean();

    if (!user || user.password !== password) {
      return null;
    }

    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      joinDate: user.joinDate,
    };
  }

  static async createUser(userData: Partial<UserDocument>): Promise<UserDocument> {
    await connectDB();
    const user = await User.create(userData);
    return user.toObject();
  }

  static async getAllUsers(): Promise<UserDocument[]> {
    await connectDB();
    return await User.find().select("-password").lean();
  }

  static async getAllUserProfiles(): Promise<UserProfile[]> {
    await connectDB();
    const users = await User.find().select("-password").lean();
    return users.map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      joinDate: user.joinDate,
    }));
  }

  static async updateUserRole(
    id: string,
    role: "admin" | "user"
  ): Promise<UserDocument | null> {
    await connectDB();
    return await User.findByIdAndUpdate(id, { role }, { new: true })
      .select("-password")
      .lean();
  }

  static async updatePhoneNumber(
    id: string,
    phoneNumber: string
  ): Promise<UserDocument | null> {
    await connectDB();
    return await User.findByIdAndUpdate(id, { phoneNumber }, { new: true })
      .select("-password")
      .lean();
  }

  // NEW METHOD: Update user profile (username, email, phoneNumber)
  static async updateUserProfile(
    id: string,
    updates: {
      username?: string;
      email?: string;
      phoneNumber?: string;
    }
  ): Promise<UserDocument | null> {
    await connectDB();

    // Filter out undefined values
    const validUpdates: Record<string, string> = {};
    if (updates.username !== undefined) validUpdates.username = updates.username;
    if (updates.email !== undefined) validUpdates.email = updates.email;
    if (updates.phoneNumber !== undefined) validUpdates.phoneNumber = updates.phoneNumber;

    return await User.findByIdAndUpdate(
      id,
      validUpdates,
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();
  }

  static async deleteUser(id: string): Promise<boolean> {
    await connectDB();
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  }

  static async countAdmins(): Promise<number> {
    await connectDB();
    return await User.countDocuments({ role: "admin" });
  }

  static async countUsers(): Promise<number> {
    await connectDB();
    return await User.countDocuments();
  }

  static async getUserStats() {
    await connectDB();
    const [totalUsers, totalAdmins, totalRegularUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    return {
      totalUsers,
      totalAdmins,
      totalRegularUsers,
    };
  }

  static async searchUsers(query: string): Promise<UserDocument[]> {
    await connectDB();
    const regex = new RegExp(query, "i");
    return await User.find({
      $or: [
        { username: regex },
        { email: regex },
        { phoneNumber: regex },
      ],
    })
      .select("-password")
      .lean();
  }

  static async getUsersByRole(role: "admin" | "user"): Promise<UserDocument[]> {
    await connectDB();
    return await User.find({ role }).select("-password").lean();
  }
}