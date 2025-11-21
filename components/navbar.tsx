"use client";

import { IdentityVerificationDialog } from "@/components/identity-verification-v2";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { fetchIdentityVerificationData } from "@/lib/api/identity";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Home,
  MapPin,
  Menu,
  Package,
  ShieldCheck,
  Truck,
  User,
  WarehouseIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
};

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => (
  <Link
    href={href}
    className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${isActive
        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
  >
    {icon}
    {label}
  </Link>
);

export function Navbar({ activePage }: { activePage?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: identityVerificationData } = useQuery({
    queryKey: ["identityVerificationData", user?.id],
    queryFn: () => fetchIdentityVerificationData(user?.id || ""),
    enabled: !!user?.id,
  });

  const isVerified =
    identityVerificationData?.data?.is_identity_verified || false;
  const identityVerificationId =
    identityVerificationData?.data?.identity_verification_id;

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={user ? "/shipments" : "/"} className="flex items-center">
          <div className="h-7 w-7 mr-2">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#E53935" />
              <path d="M10 15L30 15L20 35L10 15Z" fill="#B71C1C" />
              <path d="M20 0L30 15L10 15L20 0Z" fill="#E53935" />
            </svg>
          </div>
          <span className="font-bold text-lg">BUY2SEND</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-4">
          {user && (
            <>
              <NavItem
                href="/shipments"
                icon={<Truck size={18} className="mr-1.5" />}
                label="Shipments"
                isActive={
                  pathname === "/shipments" ||
                  pathname.startsWith("/shipments/")
                }
              />
              <NavItem
                href="/warehouses"
                icon={<WarehouseIcon size={18} className="mr-1.5" />}
                label="Warehouses"
                isActive={
                  pathname === "/warehouses" ||
                  pathname.startsWith("/warehouses/")
                }
              />
              {/* <NavItem
                href="/orders"
                icon={<FileText size={18} className="mr-1.5" />}
                label="Orders"
                isActive={pathname === "/orders"}
              /> */}
              <NavItem
                href="/account"
                icon={<User size={18} className="mr-1.5" />}
                label="Account"
                isActive={pathname === "/account"}
              />

              {!isVerified && (
                <IdentityVerificationDialog
                  userId={user.id}
                  identityVerificationId={identityVerificationId}
                >
                  <button className="flex items-center px-3 py-1.5 text-sm rounded-md transition-colors bg-red-50 text-red-600 hover:bg-red-100 font-medium">
                    <ShieldCheck size={18} className="mr-1.5" />
                    Verify Identity
                  </button>
                </IdentityVerificationDialog>
              )}
            </>
          )}
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <div className="px-4 py-3 border-b">
                <Link
                  href={user ? "/shipments" : "/"}
                  className="flex items-center"
                >
                  <div className="h-7 w-7 mr-2">
                    <svg
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#E53935" />
                      <path d="M10 15L30 15L20 35L10 15Z" fill="#B71C1C" />
                      <path d="M20 0L30 15L10 15L20 0Z" fill="#E53935" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg">BUY2SEND</span>
                </Link>
              </div>
              {user && (
                <div className="flex flex-col p-2">
                  <Link
                    href="/shipments"
                    className={`flex items-center px-3 py-3 text-base rounded-md ${pathname === "/shipments" ||
                        pathname.startsWith("/shipments/")
                        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Truck size={18} className="mr-2" />
                    Orders
                  </Link>
                  <Link
                    href="/warehouses"
                    className={`flex items-center px-3 py-3 text-base rounded-md ${pathname === "/warehouses" ||
                        pathname.startsWith("/warehouses/")
                        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Package size={18} className="mr-2" />
                    Warehouses
                  </Link>
                  <Link
                    href="/account"
                    className={`flex items-center px-3 py-3 text-base rounded-md ${pathname === "/account"
                        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <User size={18} className="mr-2" />
                    Account
                  </Link>

                  {!isVerified && (
                    <IdentityVerificationDialog
                      userId={user.id}
                      identityVerificationId={identityVerificationId}
                    >
                      <button className="flex items-center px-3 py-3 text-base rounded-md text-red-600 hover:bg-red-50 w-full text-left">
                        <ShieldCheck size={18} className="mr-2" />
                        Verify Identity
                      </button>
                    </IdentityVerificationDialog>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
