// app/(public)/layout.tsx
import { Navbar } from "@/components/navbar/navbar";
import { Footer } from "@/components/shared/footer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
