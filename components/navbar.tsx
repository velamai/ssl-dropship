import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Package, MapPin, Home } from "lucide-react"

interface NavbarProps {
  activePage?: "dashboard" | "addresses" | "orders" | "account"
}

export function Navbar({ activePage }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#E53935" />
              <path d="M10 15L30 15L20 35L10 15Z" fill="#B71C1C" />
              <path d="M20 0L30 15L10 15L20 0Z" fill="#E53935" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-dark">{"Colombo Mail"}</h1>
        </div>
        <nav className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={`text-text hover:text-primary hover:bg-accent ${activePage === "dashboard" ? "font-medium text-primary" : ""}`}
            asChild
          >
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`text-text hover:text-primary hover:bg-accent ${activePage === "addresses" ? "font-medium text-primary" : ""}`}
            asChild
          >
            <Link href="/addresses">
              <MapPin className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Addresses</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`text-text hover:text-primary hover:bg-accent ${activePage === "orders" ? "font-medium text-primary" : ""}`}
            asChild
          >
            <Link href="/orders">
              <Package className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </Link>
          </Button>
          <Link
            href="/account"
            className={`flex items-center gap-2 ml-2 px-2 py-1 rounded-full ${activePage === "account" ? "bg-[#f5e5ff]" : "hover:bg-[#fcf8ff]"}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9c4cd2]/10">
              <User size={16} className="text-[#9c4cd2]" />
            </div>
            <span
              className={`text-sm hidden sm:inline ${activePage === "account" ? "text-[#9c4cd2] font-medium" : "text-[#3f3f3f]"}`}
            >
              John Doe
            </span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

