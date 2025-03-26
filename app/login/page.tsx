/**
 * Login Page Component
 *
 * This module implements a responsive login page with client-side form validation,
 * error handling, and authentication flow. The page is split into two main sections:
 * 1. A decorative left column with logo (visible on desktop)
 * 2. A functional right column with the login form
 *
 * Key features:
 * - Client-side email and password validation
 * - Secure token-based authentication
 * - Responsive design for mobile and desktop
 * - Error handling with user-friendly messages
 * - Password visibility toggle
 * - Redirect handling after successful login
 */

"use client";

import { useState, ChangeEvent, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { validateEmail } from "@/lib/validation";
import { CustomToast, useToast } from "@/components/ui/CustomToast";
import { PublicRoute } from "../components/RouteGuards";
import { auth } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";

// Constants for error messages to maintain consistency and enable easy updates
const API_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Incorrect email or password",
  METHOD_NOT_ALLOWED: "Something went wrong. Please try again later",
  SERVER_ERROR: "Server error. Please try again after some time",
  NETWORK_ERROR: "Network error. Please check your connection.",
  TOKEN_STORAGE_ERROR: "Failed to complete login. Please try again.",
  UNEXPECTED_ERROR: "An unexpected error occurred. Please try again",
  VALIDATION_ERROR: "Invalid input. Please check your details.",
} as const;

const FORM_ERROR_MESSAGES = {
  REQUIRED_PASSWORD: "Password is required",
  MIN_PASSWORD_LENGTH: "Password must be at least 8 characters long",
} as const;

// Type definitions for better type safety and documentation
interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

interface LoginResponse {
  status: "success" | "error";
  data?: {
    token: string;
    user: {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
      usertype: string;
    };
  };
  error?: string;
  message?: string;
}

/**
 * LoginForm Component
 *
 * Handles the login form functionality including:
 * - Form state management
 * - Input validation
 * - API communication
 * - Error handling
 * - Success redirection
 */
function LoginForm() {
  // Hooks and state initialization
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { toast, showToast, hideToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handles input changes and clears corresponding error messages
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trimStart(),
    }));

    // Clear error when user starts typing
    if (formErrors[name as keyof LoginFormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Validates form data and returns validation errors if any
   */
  const validateForm = (data: LoginFormData): LoginFormErrors => {
    const errors: LoginFormErrors = {};
    const trimmedData = {
      email: data.email.trim(),
      password: data.password.trim(),
    };

    // Validate email
    if (!trimmedData.email) {
      errors.email = "Email is required";
    } else {
      const emailError = validateEmail(trimmedData.email);
      if (emailError) errors.email = emailError;
    }

    // Validate password
    if (!trimmedData.password) {
      errors.password = FORM_ERROR_MESSAGES.REQUIRED_PASSWORD;
    } else if (trimmedData.password.length < 8) {
      errors.password = FORM_ERROR_MESSAGES.MIN_PASSWORD_LENGTH;
    }

    return errors;
  };

  /**
   * Handles form submission including validation, API communication, and error handling
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedData = {
      email: formData.email.trim(),
      password: formData.password.trim(),
    };

    // Validate form before submission
    const errors = validateForm(trimmedData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = (await apiClient.login({
        email: trimmedData.email,
        password: trimmedData.password,
      })) as LoginResponse;

      if (response.status === "error") {
        const errorMessage = response.error || response.message;
        showToast(errorMessage || API_ERROR_MESSAGES.UNEXPECTED_ERROR, "error");
        return;
      }

      // Handle successful login
      if (response.status === "success" && response.data) {
        try {
          auth.setToken(response.data.token);
          const storedToken = auth.getToken();

          if (!storedToken) {
            throw new Error("Token storage failed");
          }

          showToast("Successfully signed in", "success");
          router.push(redirectTo);
        } catch (storageError) {
          console.error("Token Storage Error:", storageError);
          showToast(API_ERROR_MESSAGES.TOKEN_STORAGE_ERROR, "error");
          auth.removeToken();
        }
      } else {
        console.error("Unexpected API response format:", response);
        showToast(API_ERROR_MESSAGES.UNEXPECTED_ERROR, "error");
      }
    } catch (error: any) {
      console.error("Login Error:", error);

      if (!error.response) {
        showToast(API_ERROR_MESSAGES.NETWORK_ERROR, "error");
        return;
      }

      // Handle specific HTTP status code errors
      const { status, data } = error.response;
      switch (status) {
        case 400:
          showToast(data?.error || API_ERROR_MESSAGES.VALIDATION_ERROR, "error");
          break;
        case 401:
          showToast(API_ERROR_MESSAGES.INVALID_CREDENTIALS, "error");
          break;
        case 405:
          showToast(API_ERROR_MESSAGES.METHOD_NOT_ALLOWED, "error");
          break;
        case 500:
          showToast(API_ERROR_MESSAGES.SERVER_ERROR, "error");
          break;
        default:
          showToast(API_ERROR_MESSAGES.UNEXPECTED_ERROR, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-between px-6 py-8 lg:w-[55%] lg:px-16 lg:py-12 xl:px-24">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="mb-6 space-y-1.5">
          <h1 className="text-[22px] font-medium leading-tight text-[#3f3f3f] md:text-[26px]">
            Welcome Back to <br />
            <span className="text-[#9c4cd2]">Colombo Mail</span>
          </h1>
          <p className="text-[14px] text-[#a2a2a2]">Sign in to your account</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[14px] font-medium text-[#3f3f3f]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email"
              className={`h-[46px] w-full rounded-lg border ${
                formErrors.email ? "border-red-500" : "border-[#e2e2e2]"
              } bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]`}
            />
            {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[14px] font-medium text-[#3f3f3f]">
                Password
              </label>
              <Link href="/forgot-password" className="text-[13px] text-[#9c4cd2] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className={`h-[46px] w-full rounded-lg border ${
                  formErrors.password ? "border-red-500" : "border-[#e2e2e2]"
                } bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex h-[46px] w-full items-center justify-center rounded-lg bg-[#9c4cd2] text-[14px] font-medium text-white transition-colors hover:bg-[#8a44bb] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-[#a2a2a2]">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-[#9c4cd2] hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 text-center text-[13px] text-[#a2a2a2] lg:mt-0">
        © {new Date().getFullYear()} Colombo Mail. All rights reserved.
      </div>
    </div>
  );
}

// Main page component
export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="flex min-h-screen w-full flex-col overflow-hidden lg:flex-row">
        {/* Left Column - Illustration */}
        <div className="relative hidden w-full overflow-hidden rounded-r-[32px] bg-[#f5e5ff] lg:block lg:w-[45%]">
          {/* Logo */}
          <div className="absolute left-12 top-12 z-10">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#E53935" />
                  <path d="M10 15L30 15L20 35L10 15Z" fill="#B71C1C" />
                  <path d="M20 0L30 15L10 15L20 0Z" fill="#E53935" />
                </svg>
              </div>
              <div>
                <div className="font-bold leading-tight text-[#3f3f3f]">COLOMBO</div>
                <div className="-mt-1 text-xs font-medium text-[#E53935]">MAIL</div>
              </div>
            </div>
            <div className="mt-1 text-[10px] text-[#545454]">you sell we dispatch</div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </PublicRoute>
  );
}
