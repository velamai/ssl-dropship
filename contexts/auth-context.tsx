"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

const supabase = getSupabaseBrowserClient();

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const lastRefreshRef = useRef<number>(0);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          currentUserIdRef.current = initialSession.user?.id ?? null;
        }
      } catch (error) {
        console.error("Unexpected error during getSession:", error);
      } finally {
        setIsLoading(false);
        isInitializingRef.current = false;
      }
    };

    // Set up auth state listener
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("[Auth Listener] Event:", event, "Session:", newSession);

      const newUser = newSession?.user ?? null;
      const currentUserId = currentUserIdRef.current;
      const newUserId = newUser?.id ?? null;

      // Only update state if:
      // 1. User ID actually changed (sign in/out)
      // 2. It's not a TOKEN_REFRESHED event (we'll handle that separately)
      const userChanged = currentUserId !== newUserId;
      const isTokenRefresh = event === "TOKEN_REFRESHED";

      // For token refresh, only update session (which has new expiry times) but don't trigger re-renders
      // unless the user ID changed
      if (isTokenRefresh && !userChanged) {
        // Silently update session without causing state updates that trigger re-renders
        console.log("[Auth Listener] Token refreshed (silent session update)");
        // Update session with functional update to compare and prevent unnecessary re-renders
        setSession((prevSession) => {
          // Only update if session token or expiry actually changed
          if (
            !prevSession ||
            prevSession.access_token !== newSession?.access_token ||
            prevSession.expires_at !== newSession?.expires_at
          ) {
            return newSession;
          }
          return prevSession; // Return previous session to prevent re-render
        });
        return; // Early return to prevent router.refresh() and user state updates
      }

      // Debounce router.refresh() calls to prevent excessive requests
      const now = Date.now();
      const shouldRefresh = now - lastRefreshRef.current > 2000; // Increase throttle to 2 seconds

      // Update ref first
      currentUserIdRef.current = newUserId;

      // Update state only if user actually changed (or it's not a token refresh)
      if (userChanged || !isTokenRefresh) {
        setSession(newSession);
        setUser(newUser);
      }
      setIsLoading(false);

      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      if (event === "SIGNED_IN" && userChanged) {
        if (shouldRefresh) {
          lastRefreshRef.current = now;
          router.refresh();
        } else {
          // Debounce the refresh
          refreshTimeoutRef.current = setTimeout(() => {
            lastRefreshRef.current = Date.now();
            router.refresh();
          }, 1000);
        }
      }

      if (event === "SIGNED_OUT" && userChanged) {
        if (shouldRefresh) {
          lastRefreshRef.current = now;
          router.refresh();
          router.push("/");
        } else {
          refreshTimeoutRef.current = setTimeout(() => {
            lastRefreshRef.current = Date.now();
            router.refresh();
            router.push("/");
          }, 1000);
        }
      }
    });

    getInitialSession();

    return () => {
      isInitializingRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      authListener.unsubscribe();
    };
  }, []); // Removed router from dependencies to prevent re-initialization

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        // Don't manually set user/session here - let the auth listener handle it
        // This prevents duplicate state updates and excessive refresh calls
        const now = Date.now();
        if (now - lastRefreshRef.current > 1000) {
          lastRefreshRef.current = now;
          router.refresh();
        }
      }

      return { error };
    } catch (error) {
      console.error("Error during sign in:", error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      return { data, error };
    } catch (error) {
      console.error("Error during sign up:", error);
      return { error, data: null };
    }
  };

  const signOut = async () => {
    try {
      queryClient.clear();
      currentUserIdRef.current = null;
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      router.refresh();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshSession = async () => {
    try {
      // Throttle manual session refreshes
      const now = Date.now();
      if (now - lastRefreshRef.current < 2000) {
        console.log("[Auth] Session refresh throttled");
        return;
      }
      lastRefreshRef.current = now;

      const {
        data: { session: refreshedSession },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
