import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

// Types for the HOC props
interface RouteGuardProps {
  children: React.ReactNode;
  redirectPath?: string;
}

/**
 * HOC for protecting routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ children, redirectPath = "/login" }: RouteGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectPath);
    }
  }, [loading, isAuthenticated, router, redirectPath]);

  // Show nothing while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}

/**
 * HOC for public routes that should not be accessible when authenticated
 * Redirects to dashboard if user is already authenticated
 */
export function PublicRoute({ children, redirectPath = "/dashboard" }: RouteGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectPath);
    }
  }, [loading, isAuthenticated, router, redirectPath]);

  // Show nothing while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Only render children if not authenticated
  return !isAuthenticated ? <>{children}</> : null;
}
