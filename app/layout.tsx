import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/lib/QueryClientProvider";
import { AuthProvider } from "@/contexts/auth-context";
import { OrderDraftProvider } from "@/contexts/order-draft-context";
import { OrderDraftSheetWrapper } from "@/components/shipments/order-draft-sheet-wrapper";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buy2Send",
  description: "Buy2Send",
  generator: "Buy2Send",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" sizes="32x32" />
        <link rel="icon" href="/logo.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/logo.png" sizes="180x180" />
      </head>
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            <OrderDraftProvider>
              {children}
              <OrderDraftSheetWrapper />
              <Toaster />
            </OrderDraftProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
