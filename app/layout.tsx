// app/layout.tsx
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar/navbar";
import { Footer } from "@/components/shared/footer";
import "./globals.css";
import { UserRoleProvider } from "./providers";

export const metadata: Metadata = {
  title: "TokoRF | Jual Beli Redfinger terpercaya",
  description: "Your awesome e-commerce platform",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans} bg-dark text-primary`}>
        <UserRoleProvider>
          <Navbar />
          {children}
        </UserRoleProvider>
      </body>
    </html>
  );
}
