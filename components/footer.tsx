import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plane,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Send,
  ExternalLink,
  Package,
  Warehouse,
} from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-purple-950 text-white relative overflow-hidden">
      {/* Abstract shapes */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent opacity-5"></div>
      <div className="absolute -top-20 right-20 w-60 h-60 bg-purple-800 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute -bottom-20 left-20 w-60 h-60 bg-purple-800 rounded-full opacity-20 blur-3xl"></div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-8 h-8 border-2 border-purple-300 rounded-full opacity-20"></div>
      <div className="absolute bottom-20 right-10 w-12 h-12 border-2 border-purple-300 opacity-20 rotate-45"></div>

      <div className="container px-4 py-12 md:px-6 md:py-16 relative z-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image src="logo.jpg" width={100} height={100} alt="logo" />
              <span className="text-xl font-bold">buy2send</span>
            </div>
            <p className="text-purple-200">Global drop & ship made simple</p>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-purple-200 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="text-purple-200 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="#"
                className="text-purple-200 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="#"
                className="text-purple-200 hover:text-white transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          <div className="space-y-4 col-span-1 lg:col-span-2">
            <h3 className="text-lg font-medium">Global Offices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold overflow-hidden">
                    🇱🇰
                  </div>
                  <span className="font-medium text-white">
                    Sri Lanka Office
                  </span>
                </div>
                <div className="text-purple-200 text-sm space-y-1">
                  <p>SUPER SAVE LANKA (PVT) LTD.</p>
                  <p>No.4, COUNCIL AVENUE,</p>
                  <p>DEHIWALA, SRILANKA.</p>
                  <a
                    href="mailto:info@colombomail.lk"
                    className="block hover:text-white transition-colors"
                  >
                    info@colombomail.lk
                  </a>
                  <p>(+94) 114 896 660</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold overflow-hidden">
                    🇬🇧
                  </div>
                  <span className="font-medium text-white">UK Office</span>
                </div>
                <div className="text-purple-200 text-sm space-y-1">
                  <p>SUPER SAVE UK (PVT) LTD.</p>
                  <p>234 NORTHUMBERLAND AVENUE,</p>
                  <p>READING, RG2 7QA, UK.</p>
                  <a
                    href="mailto:uk@colombomail.lk"
                    className="block hover:text-white transition-colors"
                  >
                    uk@colombomail.lk
                  </a>
                  <p>(+44) 779 175 3342</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold overflow-hidden">
                    🇦🇪
                  </div>
                  <span className="font-medium text-white">UAE Office</span>
                </div>
                <div className="text-purple-200 text-sm space-y-1">
                  <p>SUPER SAVE GENERAL TRADING LLC,</p>
                  <p>P.O BOX 376549,</p>
                  <p>DUBAI, UAE.</p>
                  <a
                    href="mailto:uae@colombomail.lk"
                    className="block hover:text-white transition-colors"
                  >
                    uae@colombomail.lk
                  </a>
                  <p>(+971) 502 402 360</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold overflow-hidden">
                    🇮🇳
                  </div>
                  <span className="font-medium text-white">India Office</span>
                </div>
                <div className="text-purple-200 text-sm space-y-1">
                  <p>SUPER SAVE INDIA (PVT) LTD.</p>
                  <p>132 KALAYANARAM STREET,</p>
                  <p>CHENNAI - 600043, INDIA</p>
                  <a
                    href="mailto:india@colombomail.lk"
                    className="block hover:text-white transition-colors"
                  >
                    india@colombomail.lk
                  </a>
                  <p>(+91) 984 047 4896</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                    🇲🇾
                  </div>
                  <span className="font-medium text-white">
                    Malaysia Office
                  </span>
                </div>
                <div className="text-purple-200 text-sm space-y-1">
                  <p>SUPER SAVE MALAYSIA (PVT) LTD.</p>
                  <p>VISTA ALAM SERVICE APARTMENT,</p>
                  <p>SHAH ALAM, MALAYSIA</p>
                  <a
                    href="mailto:malaysia@colombomail.lk"
                    className="block hover:text-white transition-colors"
                  >
                    malaysia@colombomail.lk
                  </a>
                  <p>(+60) 162 860 465</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/login"
                  className="text-purple-200 hover:text-white transition-colors flex items-center"
                >
                  <Warehouse className="size-4 mr-1.5" />
                  Warehouse Service
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-purple-200 hover:text-white transition-colors flex items-center"
                >
                  <Package className="size-4 mr-1.5" />
                  Product URL Service
                </Link>
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6">Newsletter</h3>
            <p className="text-purple-200">
              Subscribe to our newsletter for the latest updates and offers.
            </p>
            <form className="space-y-2">
              <div className="relative">
                <Input
                  className="bg-purple-900 border-purple-700 text-white placeholder:text-purple-300 pr-10"
                  placeholder="Your email address"
                  type="email"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
              </div>
              <Button className="w-full flex items-center justify-center">
                <Send className="mr-2 h-4 w-4" />
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        <div className="mt-8 border-t border-purple-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-purple-300">
              &copy; {new Date().getFullYear()} Universal Mail. All rights
              reserved.
            </p>
            <nav className="flex gap-4 text-sm text-purple-300">
              <Link
                href="/terms"
                className="hover:text-white flex items-center"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Terms & Conditions
              </Link>
              <Link
                href="/refund"
                className="hover:text-white flex items-center"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Cancellation & Refund Policy
              </Link>
              <Link
                href="/shipping-policy"
                className="hover:text-white flex items-center"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Shipping & Delivery Policy
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
