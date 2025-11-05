"use client";

import type React from "react";

import { toast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

// Get the singleton instance
const supabase = getSupabaseBrowserClient();

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Show success toast
      toast({
        title: "Login successful",
        description: "You have been successfully logged in.",
        variant: "default",
      });

      // Redirect to shipments page after successful sign-in
      router.push("/shipments");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Failed to sign in. Please check your credentials."
      );
      toast({
        title: "Login failed",
        description:
          err.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password reset email sent",
        description: `Instructions have been sent to ${resetEmail}`,
        variant: "default",
      });

      setShowForgotPasswordModal(false);
      setResetEmail("");
    } catch (err: any) {
      console.error("Password reset error:", err);
      toast({
        title: "Password reset failed",
        description:
          err.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col overflow-hidden lg:flex-row">
        {/* Left Column - Illustration */}
        <div className="relative hidden w-full overflow-hidden rounded-r-[32px] bg-[#f5e5ff] lg:block lg:w-[45%]">
          {/* Logo */}
          <div className="absolute left-12 top-12 z-10">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10">
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#E53935" />
                  <path d="M10 15L30 15L20 35L10 15Z" fill="#B71C1C" />
                  <path d="M20 0L30 15L10 15L20 0Z" fill="#E53935" />
                </svg>
              </div>
              <div>
                <div className="font-bold leading-tight text-[#3f3f3f]">
                  BUY2SEND
                </div>
                {/* <div className="-mt-1 text-xs font-medium text-[#E53935]">
                  DROP SHIP
                </div> */}
              </div>
            </div>
            <div className="mt-1 text-[10px] text-[#545454]">
              we ship your orders
            </div>
          </div>

          {/* Illustration */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* Circle background */}
            <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9a3bd9]/10"></div>

            {/* Clouds */}
            <div className="relative h-[450px] w-[450px]">
              <div className="absolute left-[50px] top-[100px] h-[20px] w-[40px] rounded-[10px] bg-white"></div>
              <div className="absolute left-[20px] top-[180px] h-[25px] w-[80px] rounded-[12px] bg-white"></div>
              <div className="absolute left-[150px] top-[60px] h-[25px] w-[60px] rounded-[12px] bg-white"></div>
              <div className="absolute right-[80px] top-[80px] h-[30px] w-[120px] rounded-[15px] bg-white"></div>
              <div className="absolute bottom-[120px] left-[60px] h-[25px] w-[70px] rounded-[12px] bg-white"></div>
              <div className="absolute bottom-[80px] right-[40px] h-[30px] w-[110px] rounded-[15px] bg-white"></div>

              <Image
                src="purple-airplane.png"
                alt="Login Illustration"
                width={450}
                height={450}
                className="object-contain relative z-10 translate-x-6 -translate-y-6"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Sign In Form */}
        <div className="flex w-full flex-col justify-between px-6 py-8 lg:w-[55%] lg:px-16 lg:py-12 xl:px-24">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#E53935" />
                <path d="M10 15L30 15L20 35L10 15Z" fill="#B71C1C" />
                <path d="M20 0L30 15L10 15L20 0Z" fill="#E53935" />
              </svg>
            </div>
            <div>
              <div className="font-bold leading-tight text-[#3f3f3f]">
                COLOMBO
              </div>
              <div className="-mt-1 text-xs font-medium text-[#E53935]">
                MAIL
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[380px]">
            <div className="mb-6 space-y-1.5">
              <h1 className="text-[28px] font-medium leading-tight text-[#3f3f3f] md:mt-16">
                Welcome to{" "}
                <span className=" font-bold text-[#9c4cd2]">BUY2SEND</span>
              </h1>
              <p className="text-[14px] text-[#a2a2a2] mt-2">
                Please enter your email and password to proceed
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[14px] font-medium text-[#3f3f3f]"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[14px] font-medium text-[#3f3f3f]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a2a2a2] hover:text-[#3f3f3f]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(true);
                  }}
                  className="text-[13px] font-medium text-[#9c4cd2] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-[46px] w-full rounded-lg bg-[#9a3bd9] text-[14px] font-medium text-white transition-colors hover:bg-[#9a3bd9]/90 disabled:opacity-70"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>

              <div className="text-center text-[13px] text-[#a2a2a2]">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-[#9c4cd2] font-medium hover:underline"
                >
                  Register
                </Link>
              </div>
            </form>
          </div>

          {/* Bottom decorative elements */}
          <div className="hidden lg:block absolute bottom-0 right-0 opacity-10">
            <svg
              width="400"
              height="200"
              viewBox="0 0 400 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M350 150 C380 120 390 80 370 50 C350 20 300 10 250 30 C200 50 150 40 120 10 C90 -20 40 -10 20 30 C0 70 20 120 60 150 C100 180 150 170 200 150 C250 130 320 180 350 150Z"
                fill="#9a3bd9"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowForgotPasswordModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
        >
          <div
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9a3bd9] focus:ring-offset-2"
              aria-label="Close forgot password dialog"
            >
              <EyeOff size={16} />
            </button>

            <div className="text-center">
              <h2
                id="forgot-password-title"
                className="mb-4 text-xl font-medium text-[#5f5672]"
              >
                Forgot Your Password?
              </h2>

              <p className="mb-6 text-[14px] text-[#abb3ba]">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="reset-email"
                    className="block text-left text-[14px] font-medium text-[#3f3f3f]"
                  >
                    Email address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-white px-3.5 text-[14px] outline-none transition-colors focus:border-[#9a3bd9] focus:ring-1 focus:ring-[#9a3bd9]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-[46px] w-full rounded-lg bg-[#9a3bd9] text-[15px] font-medium text-white transition-all hover:bg-[#8a34c3] focus:outline-none focus:ring-2 focus:ring-[#9a3bd9] focus:ring-offset-2 active:scale-[0.98]"
                >
                  Reset Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
