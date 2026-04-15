"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const supabase = getSupabaseBrowserClient();

const VERIFY_TIMEOUT_MS = 20000;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionReadyRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let failTimer: ReturnType<typeof setTimeout> | undefined;

    const clearFailTimer = () => {
      if (failTimer) {
        clearTimeout(failTimer);
        failTimer = undefined;
      }
    };

    const markReady = () => {
      sessionReadyRef.current = true;
      clearFailTimer();
      if (!cancelled) {
        setReady(true);
        setVerifyFailed(false);
      }
    };

    failTimer = setTimeout(() => {
      if (!cancelled && !sessionReadyRef.current) {
        setVerifyFailed(true);
      }
    }, VERIFY_TIMEOUT_MS);

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled && session) {
        markReady();
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        (event === "SIGNED_IN" && session)
      ) {
        markReady();
      }
    });

    return () => {
      cancelled = true;
      clearFailTimer();
      subscription.unsubscribe();
    };
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      toast({
        title: "Password reset failed",
        description: updateError.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setIsSuccess(true);
    toast({
      title: "Password updated",
      description: "Your password has been successfully reset.",
      variant: "default",
    });
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  if (verifyFailed && !ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fefcff] px-4">
        <div className="w-full max-w-md rounded-lg border border-[#e2e2e2] bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-medium text-[#3f3f3f]">
            Link invalid or expired
          </h1>
          <p className="mt-2 text-sm text-[#a2a2a2]">
            Request a new password reset from the login page.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fefcff] px-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-[#a2a2a2]">Verifying your link...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fefcff] px-4">
        <CheckCircle className="h-10 w-10 text-green-600" />
        <h2 className="text-xl font-medium text-[#3f3f3f]">Password updated</h2>
        <p className="text-sm text-[#a2a2a2]">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fefcff] px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-[#e2e2e2] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-medium text-[#3f3f3f]">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-[#a2a2a2]">
            Enter and confirm your new password below.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          {error && (
            <div
              className="rounded-md bg-red-50 p-3 text-sm text-red-600"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={isLoading}
                className="h-[46px] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a2a2a2] hover:text-[#3f3f3f]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={isLoading}
                className="h-[46px] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a2a2a2] hover:text-[#3f3f3f]"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="h-[46px] w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>

          <p className="text-center text-sm text-[#a2a2a2]">
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
