"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    if (!isLoading && !user) {
      hasRedirectedRef.current = true;
      // Redirect to login page with the current path as redirect parameter
      const currentPath = pathname || window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } else if (user) {
      // Reset redirect flag when user is present
      hasRedirectedRef.current = false;
    }
  }, [user, isLoading, router, pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  return <>{children}</>;
}
