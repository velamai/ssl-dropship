import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/lib/QueryClientProvider";
import { AuthProvider } from "@/contexts/auth-context";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buy2Send",
  description: "Buy2Send",
  generator: "Buy2Send",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
