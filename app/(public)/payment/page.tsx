// app/(public)/dashboard/page.tsx

// This is MOCK DATA - just hardcoded values for testing
const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  joinDate: "January 1, 2024",
  totalSpent: "Rp 210.000",
  totalPurchases: 2,
  activeVIP: true,
  vipExpiry: "April 15, 2024",
};

export default function DashboardPage() {
  return (
    <div>
      {/* Now you can use mockUser anywhere */}
      <h1>Welcome, {mockUser.name}!</h1>
      <p>Email: {mockUser.email}</p>
      <p>Member since: {mockUser.joinDate}</p>
    </div>
  );
}
