// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { User, Package, MapPin, Home } from "lucide-react"

// interface NavbarProps {
//   activePage?: "dashboard" | "addresses" | "orders" | "account"
// }

// export function Navbar({ activePage }: NavbarProps) {
//   return (
//     <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
//       <div className="container flex h-16 items-center justify-between px-4">
//         <div className="flex items-center gap-4">
//           <div className="h-8 w-8">
//             <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#E53935" />
//               <path d="M10 15L30 15L20 35L10 15Z" fill="#B71C1C" />
//               <path d="M20 0L30 15L10 15L20 0Z" fill="#E53935" />
//             </svg>
//           </div>
//           <h1 className="text-xl font-semibold text-dark">{"Colombo Mail"}</h1>
//         </div>
//         <nav className="flex items-center gap-4">
//           <Button
//             variant="ghost"
//             size="sm"
//             className={`text-text hover:text-primary hover:bg-accent ${activePage === "dashboard" ? "font-medium text-primary" : ""}`}
//             asChild
//           >
//             <Link href="/dashboard">
//               <Home className="mr-2 h-4 w-4" />
//               <span className="hidden sm:inline">Dashboard</span>
//             </Link>
//           </Button>
//           <Button
//             variant="ghost"
//             size="sm"
//             className={`text-text hover:text-primary hover:bg-accent ${activePage === "addresses" ? "font-medium text-primary" : ""}`}
//             asChild
//           >
//             <Link href="/addresses">
//               <MapPin className="mr-2 h-4 w-4" />
//               <span className="hidden sm:inline">Addresses</span>
//             </Link>
//           </Button>
//           <Button
//             variant="ghost"
//             size="sm"
//             className={`text-text hover:text-primary hover:bg-accent ${activePage === "orders" ? "font-medium text-primary" : ""}`}
//             asChild
//           >
//             <Link href="/orders">
//               <Package className="mr-2 h-4 w-4" />
//               <span className="hidden sm:inline">Orders</span>
//             </Link>
//           </Button>
//           <Link
//             href="/account"
//             className={`flex items-center gap-2 ml-2 px-2 py-1 rounded-full ${activePage === "account" ? "bg-[#f5e5ff]" : "hover:bg-[#fcf8ff]"}`}
//           >
//             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9c4cd2]/10">
//               <User size={16} className="text-[#9c4cd2]" />
//             </div>
//             <span
//               className={`text-sm hidden sm:inline ${activePage === "account" ? "text-[#9c4cd2] font-medium" : "text-[#3f3f3f]"}`}
//             >
//               John Doe
//             </span>
//           </Link>
//         </nav>
//       </div>
//     </header>
//   )
// }

"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import {
  FileText,
  Home,
  MapPin,
  Menu,
  Package,
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
    className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
      isActive
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
                    className={`flex items-center px-3 py-3 text-base rounded-md ${
                      pathname === "/shipments" ||
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
                    className={`flex items-center px-3 py-3 text-base rounded-md ${
                      pathname === "/warehouses" ||
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
                    className={`flex items-center px-3 py-3 text-base rounded-md ${
                      pathname === "/account"
                        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <User size={18} className="mr-2" />
                    Account
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
