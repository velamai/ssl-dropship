"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
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
        }
      } catch (error) {
        console.error("Unexpected error during getSession:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("[Auth Listener] Event:", event, "Session:", newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (event === "SIGNED_IN") {
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        router.refresh();
        router.push("/");
      }
    });

    getInitialSession();

    return () => {
      authListener.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        router.refresh();
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
