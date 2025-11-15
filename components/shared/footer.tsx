// components/shared/footer.tsx
import Link from "next/link";
import { Mail, Phone, MapPin, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white flex items-center justify-center rounded-sm">
                <span className="text-black font-bold text-xs">▲</span>
              </div>
              <span className="font-medium text-sm tracking-wide text-[#ededed]">
                STORE
              </span>
            </div>
            <p className="text-sm text-[#a1a1a1]">
              Your awesome e-commerce platform for quality products.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-[#ededed] text-sm">
              Quick Links
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-[#a1a1a1] hover:text-[#ededed] transition text-sm"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-[#a1a1a1] hover:text-[#ededed] transition text-sm"
              >
                Products
              </Link>
              <Link
                href="/dashboard"
                className="text-[#a1a1a1] hover:text-[#ededed] transition text-sm"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-[#ededed] text-sm">Support</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="#"
                className="text-[#a1a1a1] hover:text-[#ededed] transition text-sm"
              >
                Help Center
              </Link>
              <Link
                href="#"
                className="text-[#a1a1a1] hover:text-[#ededed] transition text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-[#a1a1a1] hover:text-[#ededed] transition text-sm"
              >
                Terms of Service
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-[#ededed] text-sm">Contact Us</h3>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:support@store.com"
                className="flex items-center gap-2 text-[#a1a1a1] hover:text-[#ededed] transition text-sm"
              >
                <Mail className="w-4 h-4" />
                support@store.com
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center gap-2 text-[#a1a1a1] hover:text-[#ededed] transition text-sm"
              >
                <Phone className="w-4 h-4" />
                +1 (234) 567-890
              </a>
              <div className="flex items-center gap-2 text-[#a1a1a1] text-sm">
                <MapPin className="w-4 h-4" />
                Jakarta, Indonesia
              </div>
            </div>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#a1a1a1] text-xs">
            &copy; 2024 Store. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-[#a1a1a1] hover:text-[#52a8ff] transition"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-[#a1a1a1] hover:text-[#52a8ff] transition"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-[#a1a1a1] hover:text-[#52a8ff] transition"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
