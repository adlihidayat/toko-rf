// app/(auth)/layout.tsx
import { Navbar } from "@/components/navbar/navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="pt-16 min-h-screen w-full flex items-center">
        {children}
      </main>
    </>
  );
}
