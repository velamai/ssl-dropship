"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 shadow-md ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl"
          : "bg-white/80 backdrop-blur-lg"
      } border-b border-border`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 hover-scale cursor-pointer">
            {/* <div className="w-10 h-10 bg-pink-gradient rounded-lg flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-pink-600 animate-gradient">Buy2send</span> */}
            <Image src="/logo.png" alt="logo" width={75} height={75} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-primary transition-all relative group"
            >
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-gradient group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="#services"
              className="text-sm font-medium hover:text-primary transition-all relative group"
            >
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-gradient group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="#countries"
              className="text-sm font-medium hover:text-primary transition-all relative group"
            >
              Countries
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-gradient group-hover:w-full transition-all duration-300" />
            </Link>
             <Link
              href="/tracking"
              className="text-sm font-medium hover:text-primary transition-all relative group"
            >
              Track Your Shipment
            </Link>
            <Link
              href="/product-price-calculator"
              className={`text-sm font-medium transition-all relative group ${
                pathname === "/product-price-calculator"
                  ? "text-primary"
                  : "hover:text-primary"
              }`}
            >
              Pricing Calculator
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-gradient group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="#faqs"
              className="text-sm font-medium hover:text-primary transition-all relative group"
            >
              FAQs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-gradient group-hover:w-full transition-all duration-300" />
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/register">
              <Button
                size="sm"
                className="bg-pink-gradient text-white hover:opacity-90 hover:shadow-lg transition-all hover:scale-105"
              >
                Signup
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-primary/10 transition-all border-primary text-primary hover:border-primary bg-transparent"
              >
                Login
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link
              href="#how-it-works"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#services"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="#countries"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Countries
            </Link>
             <Link
              href="/tracking"
               onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
            >
              Track Your Shipment
            </Link>
            <Link
              href="/product-price-calculator"
              className={`block py-2 text-sm font-medium transition-colors ${
                pathname === "/product-price-calculator"
                  ? "text-primary"
                  : "hover:text-primary"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing Calculator
            </Link>
            <Link
              href="#faqs"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQs
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  size="sm"
                  className="bg-pink-gradient text-white hover:opacity-90 w-full"
                >
                  Signup
                </Button>
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary bg-transparent w-full"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
