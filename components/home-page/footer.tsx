import { Package, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-accent/30 to-white border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* <div className="w-10 h-10 bg-pink-gradient rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-pink-gradient bg-clip-text text-transparent">Buy2send</span> */}
              <Image src="/logo.png" alt="logo" width={75} height={75} />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your trusted partner for global shopping and shipping from India,
              Sri Lanka, Dubai, Malaysia, and UK.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/buy2send/"
                className="text-muted-foreground hover:text-primary transition-colors"
                target="_blank"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold mb-4">Services</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Virtual Warehouse
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Product Link to Ship
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Package Consolidation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Shipping Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Customs Assistance
                </Link>
              </li>
            </ul>
          </div>

          {/* Countries */}
          <div>
            <h3 className="font-bold mb-4">Shop From</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Image src="/flags/in.png" alt="India" width={20} height={20} className="rounded-sm object-cover" />
                  India
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Image src="/flags/sl.png" alt="Sri Lanka" width={20} height={20} className="rounded-sm object-cover" />
                  Sri Lanka
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Image src="/flags/uae.png" alt="Dubai (UAE)" width={20} height={20} className="rounded-sm object-cover" />
                  Dubai (UAE)
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Image src="/flags/ml.png" alt="Malaysia" width={20} height={20} className="rounded-sm object-cover" />
                  Malaysia
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Image src="/flags/uk.png" alt="United Kingdom" width={20} height={20} className="rounded-sm object-cover" />
                  United Kingdom
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:support@buy2send.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  hello@buy2send.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+91 9840635406"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  +91 98406 35406
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                GF 4, MANDIRA APARTMENTS, No.112, NORTH BOAG ROAD, T NAGAR, CHENNAI, TAMILNADU - 600017
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Buy2send. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
