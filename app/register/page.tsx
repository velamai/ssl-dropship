"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, X, Eye, EyeOff } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { validateForm, validateEmail, FormErrors } from "@/lib/validation";
import { CustomToast, useToast } from "@/components/ui/CustomToast";
import { auth } from "@/lib/auth";
import { PublicRoute } from "../components/RouteGuards";

interface FormData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SendOtpResponse {
  success: boolean;
  message: string;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  verified?: boolean;
  severity?: string;
}

interface RegisterData {
  token: string;
  user?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
}

interface RegisterResponse {
  status: "success" | "error";
  message?: string;
  error?: string;
  data?: RegisterData;
}

interface ApiErrorData {
  status: string;
  error?: string;
  message?: string;
}

interface ApiError {
  response?: {
    data?: ApiErrorData;
    status?: number;
  };
  message?: string;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  action?: ToastAction;
}

interface OtpErrors {
  code?: string;
}

// Enhanced error message mappings for better user experience
const ERROR_MESSAGES = {
  // HTTP Status Code based messages
  STATUS_400: "The provided information is not valid. Please check your input and try again.",
  STATUS_401: "Your session has expired. Please try again.",
  STATUS_403: "You don't have permission to perform this action.",
  STATUS_404: "The requested service is not available at the moment.",
  STATUS_429: "Too many attempts. Please wait a moment before trying again.",
  STATUS_500: "We're experiencing technical difficulties. Please try again later.",

  // Specific error messages
  USER_EXISTS: "An account with this email already exists. Please try signing in.",
  INVALID_EMAIL: "Please enter a valid email address.",
  WEAK_PASSWORD:
    "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.",
  INVALID_PASSWORD: "The password format is incorrect. Please check the requirements below.",
  PASSWORDS_NOT_MATCH: "The passwords you entered don't match. Please try again.",
  INVALID_NAME: "Name should only contain letters and be at least 2 characters long.",
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
  UNKNOWN_ERROR: "Something went wrong. Please try again later.",
  SERVER_ERROR: "Server error occurred. Please try again later.",

  // Field-specific validation messages
  REQUIRED_FIELD: (field: string) => `${field} is required.`,
  INVALID_FORMAT: (field: string) => `${field} format is invalid.`,
  TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters long.`,
  TOO_LONG: (field: string, max: number) => `${field} cannot exceed ${max} characters.`,
} as const;

// Enhanced helper function to get user-friendly error message
const getErrorMessage = (error: ApiError): string => {
  const errorData = error.response?.data;
  const statusCode = error.response?.status;

  // Handle network errors
  if (!errorData && !statusCode) {
    return error.message === "Network Error" ? ERROR_MESSAGES.NETWORK_ERROR : ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Handle HTTP status codes
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return getDetailedBadRequestMessage(errorData);
      case 401:
        return ERROR_MESSAGES.STATUS_401;
      case 403:
        return ERROR_MESSAGES.STATUS_403;
      case 404:
        return ERROR_MESSAGES.STATUS_404;
      case 429:
        return ERROR_MESSAGES.STATUS_429;
      case 500:
        return ERROR_MESSAGES.STATUS_500;
    }
  }

  // Handle specific error messages from the API
  if (errorData) {
    const errorMessage = errorData.error?.toLowerCase() || errorData.message?.toLowerCase() || "";

    if (errorMessage.includes("already exists")) {
      return ERROR_MESSAGES.USER_EXISTS;
    }

    if (errorMessage.includes("invalid email")) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }

    if (errorMessage.includes("password")) {
      if (errorMessage.includes("match")) {
        return ERROR_MESSAGES.PASSWORDS_NOT_MATCH;
      }
      if (errorMessage.includes("weak")) {
        return ERROR_MESSAGES.WEAK_PASSWORD;
      }
      return ERROR_MESSAGES.INVALID_PASSWORD;
    }

    if (errorMessage.includes("name")) {
      return ERROR_MESSAGES.INVALID_NAME;
    }

    // If API provides a specific message, use it
    if (errorData.message) {
      return errorData.message;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Helper function to get detailed message for 400 Bad Request errors
const getDetailedBadRequestMessage = (errorData?: ApiErrorData): string => {
  if (!errorData) return ERROR_MESSAGES.STATUS_400;

  const errorMessage = errorData.error?.toLowerCase() || errorData.message?.toLowerCase() || "";

  // Handle specific validation errors
  if (errorMessage.includes("required")) {
    const field = errorMessage.split(" ")[0];
    return ERROR_MESSAGES.REQUIRED_FIELD(field.charAt(0).toUpperCase() + field.slice(1));
  }

  if (errorMessage.includes("invalid")) {
    if (errorMessage.includes("email")) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }
    if (errorMessage.includes("password")) {
      return ERROR_MESSAGES.INVALID_PASSWORD;
    }
    if (errorMessage.includes("name")) {
      return ERROR_MESSAGES.INVALID_NAME;
    }
  }

  return errorData.message || ERROR_MESSAGES.STATUS_400;
};

// Simple error message mapping for registration
const API_ERROR_MESSAGES = {
  getErrorMessage: (error: any): string => {
    // Handle network errors
    if (!error.response) {
      return "Unable to connect to the server. Please check your internet connection.";
    }

    const errorMessage = error.response?.data?.error?.toLowerCase() || "";

    // Handle specific error messages
    if (errorMessage.includes("already exists")) {
      return "User already exists";
    }
    if (errorMessage.includes("missing required field")) {
      return errorMessage;
    }
    if (errorMessage.includes("method not allowed")) {
      return "Method not allowed";
    }
    if (errorMessage.includes("internal server error")) {
      return "Something went wrong. Please try again later.";
    }

    // If it's a validation error, return the exact message
    return error.response?.data?.error || "Something went wrong. Please try again later.";
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [otpErrors, setOtpErrors] = useState<OtpErrors>({});
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // If changing email after verification, reset verification status
    if (name === "email" && isEmailVerified && value !== verifiedEmail) {
      setIsEmailVerified(false);
      setVerifiedEmail("");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value.trimStart(), // Trim leading whitespace while typing
    }));

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Add OTP validation function
  const validateOtp = (otp: string): string | null => {
    if (!otp) {
      return "OTP is required";
    }
    if (!/^\d{6}$/.test(otp)) {
      return "OTP must be 6 digits";
    }
    return null;
  };

  const startResendTimer = () => {
    setResendTimer(30); // 30 seconds cooldown
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const trimmedEmail = formData.email.trim();

    // Validate email - Only set field error, no toast
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setFormErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    setIsSendingEmailOtp(true); // New loading state for email verify button
    setIsResendingOtp(true);
    try {
      const response = await apiClient.sendOtp({
        identifier: trimmedEmail,
        type: "EMAIL",
      });

      const typedResponse = response as unknown as SendOtpResponse;

      if (typedResponse.success) {
        setShowVerifyModal(true);
        showToast("OTP sent successfully. Please check your email.", "success");
        startResendTimer();
        // Clear any existing OTP and errors when sending new OTP
        setOtpValue("");
        setOtpErrors({});
      } else {
        const errorMessage = typedResponse.message || "Failed to send OTP";
        if (errorMessage.toLowerCase().includes("already exists")) {
          setFormErrors((prev) => ({
            ...prev,
            email: "Email is already registered",
          }));
          showToast("This email is already registered", "info", {
            action: {
              label: "Sign In",
              onClick: () => router.push("/login"),
            },
          });
        } else if (errorMessage.toLowerCase().includes("too many requests")) {
          showToast("Please wait before requesting another OTP", "warning");
        } else {
          showToast(errorMessage, "error");
        }
      }
    } catch (error: any) {
      console.error("OTP Error:", error);
      if (!error.response) {
        showToast("Network error. Please check your connection.", "error");
      } else {
        const errorMessage = error.response.data?.message || "Failed to send OTP";
        showToast(errorMessage, "error");
      }
    } finally {
      setIsSendingEmailOtp(false);
      setIsResendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    // Clear previous errors
    setOtpErrors({});
    setIsVerifying(true);

    // Validate OTP format
    const otpError = validateOtp(otpValue);
    if (otpError) {
      setOtpErrors({ code: otpError });
      setIsVerifying(false);
      return;
    }

    try {
      const response = await apiClient.verifyOtp({
        identifier: formData.email.trim(),
        type: "EMAIL",
        otp: otpValue,
      });

      const typedResponse = response as unknown as VerifyResponse;

      if (typedResponse.success) {
        setShowVerifyModal(false);
        setIsEmailVerified(true);
        setVerifiedEmail(formData.email.trim());
        showToast("Email verified successfully", "success");
        setOtpValue("");
        setOtpErrors({});
      } else {
        const errorMessage = typedResponse.message?.toLowerCase() || "";

        if (errorMessage.includes("expired")) {
          showToast("OTP has expired. Please request a new one.", "warning");
          setOtpErrors({ code: "OTP has expired" });
        } else if (errorMessage.includes("invalid")) {
          setOtpErrors({ code: "Invalid OTP code" });
        } else if (errorMessage.includes("attempts")) {
          showToast("Too many failed attempts. Please request a new OTP.", "warning");
          setOtpErrors({ code: "Too many failed attempts" });
        } else {
          setOtpErrors({ code: typedResponse.message || "Verification failed" });
        }
        setOtpValue("");
      }
    } catch (error: any) {
      console.error("Verify Error:", error);
      if (!error.response) {
        showToast("Network error. Please check your connection.", "error");
      } else {
        const errorMessage = error.response.data?.message || "Verification failed";
        setOtpErrors({ code: errorMessage });
      }
      setOtpValue("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async () => {
    // Check if email is verified
    if (!isEmailVerified) {
      showToast("Please verify your email before registering", "warning");
      return;
    }

    // Trim all form data before validation
    const trimmedData = {
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      email: formData.email.trim(),
      password: formData.password.trim(),
      confirmPassword: formData.confirmPassword.trim(),
    };

    // Validate form inputs - Only set field errors, no toasts
    const errors = validateForm(trimmedData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = (await apiClient.register({
        firstname: trimmedData.firstname,
        lastname: trimmedData.lastname,
        email: trimmedData.email,
        password: trimmedData.password,
        usertype: "dropship",
      })) as RegisterResponse;

      if (response.status === "success" && response.data?.token) {
        auth.setToken(response.data.token);
        showToast("Registration successful! Redirecting to dashboard...", "success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else if (response.status === "error") {
        const errorMessage = API_ERROR_MESSAGES.getErrorMessage({
          response: { data: { error: response.error } },
        });

        showToast(errorMessage, "error", {
          // Add Sign In action only for "User already exists" error
          ...(errorMessage === "User already exists" && {
            action: {
              label: "Sign In",
              onClick: () => router.push("/login"),
            },
          }),
        });
      }
    } catch (error: any) {
      console.error("Registration Error:", error);
      const errorMessage = API_ERROR_MESSAGES.getErrorMessage(error);

      showToast(errorMessage, "error", {
        // Add Sign In action only for "User already exists" error
        ...(errorMessage === "User already exists" && {
          action: {
            label: "Sign In",
            onClick: () => router.push("/login"),
          },
        }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to check if an error is a validation error
  const isValidationError = (errorMessage: string): boolean => {
    const validationKeywords = ["required", "invalid", "must be", "cannot be", "should be", "minimum", "maximum"];
    return validationKeywords.some((keyword) => errorMessage.toLowerCase().includes(keyword));
  };

  // Helper function to parse validation errors into field errors
  const parseValidationErrors = (errorMessage: string): FormErrors => {
    const errors: FormErrors = {};

    if (errorMessage.toLowerCase().includes("email")) {
      errors.email = errorMessage;
    } else if (errorMessage.toLowerCase().includes("password")) {
      errors.password = errorMessage;
    } else if (errorMessage.toLowerCase().includes("firstname")) {
      errors.firstname = errorMessage;
    } else if (errorMessage.toLowerCase().includes("lastname")) {
      errors.lastname = errorMessage;
    }

    return errors;
  };

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

        {/* Right Column - Registration Form */}
        <div className="flex w-full flex-col justify-between px-6 py-8 lg:w-[55%] lg:px-16 lg:py-12 xl:px-24">
          <div className="mx-auto w-full max-w-[380px]">
            <div className="mb-6 space-y-1.5">
              <h1 className="text-[22px] font-medium leading-tight text-[#3f3f3f] md:text-[26px]">
                Get Started <br />
                with <span className="text-[#9c4cd2]">Colombo Mail</span>
              </h1>
              <p className="text-[14px] text-[#a2a2a2]">Register your account</p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1.5">
                <label htmlFor="firstname" className="block text-[14px] font-medium text-[#3f3f3f]">
                  First Name
                </label>
                <input
                  id="firstname"
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className={`h-[46px] w-full rounded-lg border ${
                    formErrors.firstname ? "border-red-500" : "border-[#e2e2e2]"
                  } bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]`}
                />
                {formErrors.firstname && <p className="text-xs text-red-500">{formErrors.firstname}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="lastname" className="block text-[14px] font-medium text-[#3f3f3f]">
                  Last Name
                </label>
                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className={`h-[46px] w-full rounded-lg border ${
                    formErrors.lastname ? "border-red-500" : "border-[#e2e2e2]"
                  } bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]`}
                />
                {formErrors.lastname && <p className="text-xs text-red-500">{formErrors.lastname}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[14px] font-medium text-[#3f3f3f]">
                  Email
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className={`h-[46px] w-full rounded-lg border ${
                        formErrors.email ? "border-red-500" : isEmailVerified ? "border-green-500" : "border-[#e2e2e2]"
                      } bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]`}
                    />
                    {isEmailVerified && formData.email === verifiedEmail && (
                      <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                    {isEmailVerified && formData.email !== verifiedEmail && (
                      <span className="absolute -bottom-5 left-0 text-xs text-amber-600">
                        Email changed. Verification required.
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingEmailOtp || (isEmailVerified && formData.email === verifiedEmail)}
                    className={`h-[46px] w-[100px] rounded-lg ${
                      isEmailVerified && formData.email === verifiedEmail
                        ? "bg-green-500 cursor-not-allowed"
                        : "bg-[#9a3bd9] hover:bg-[#9a3bd9]/90"
                    } text-[14px] font-medium text-white transition-colors disabled:opacity-50 relative`}
                  >
                    {isSendingEmailOtp ? (
                      <>
                        <span className="opacity-0">Verify</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        </div>
                      </>
                    ) : isEmailVerified && formData.email === verifiedEmail ? (
                      "Verified"
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
                {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[14px] font-medium text-[#3f3f3f]">
                  Password
                </label>
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

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-[14px] font-medium text-[#3f3f3f]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className={`h-[46px] w-full rounded-lg border ${
                      formErrors.confirmPassword ? "border-red-500" : "border-[#e2e2e2]"
                    } bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formErrors.confirmPassword && <p className="text-xs text-red-500">{formErrors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                onClick={handleRegister}
                disabled={isSubmitting}
                className="h-[46px] w-full rounded-lg bg-[#9a3bd9] text-[14px] font-medium text-white transition-colors hover:bg-[#9a3bd9]/90 disabled:opacity-70"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>

              <div className="text-center text-[13px] text-[#a2a2a2]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#9c4cd2] hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Verification Modal */}
        {showVerifyModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-title"
          >
            <div
              className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setOtpValue("");
                  setOtpErrors({});
                }}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9a3bd9] focus:ring-offset-2"
                aria-label="Close verification dialog"
              >
                <X size={16} />
              </button>

              <div className="text-center">
                <h2 id="verification-title" className="mb-4 text-xl font-medium text-[#5f5672]">
                  Verify Your Email
                </h2>

                <p className="mb-1 text-[14px] text-[#abb3ba]">Enter the 6-digit code sent to {formData.email}</p>

                <div className="relative mb-6">
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpValue(value);
                      if (otpErrors.code) {
                        setOtpErrors({});
                      }
                    }}
                    placeholder="000000"
                    className={`h-[48px] w-full rounded-lg border ${
                      otpErrors.code ? "border-red-500" : "border-[#e2e2e2]"
                    } bg-white px-4 text-center text-[15px] font-medium tracking-wider outline-none transition-colors focus:border-[#9a3bd9] focus:ring-1 focus:ring-[#9c4cd2]`}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="\d*"
                    aria-label="Verification code"
                    autoFocus
                  />
                  {otpErrors.code && (
                    <p className="absolute -bottom-6 left-0 right-0 text-xs text-red-500 mb-1">{otpErrors.code}</p>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={otpValue.length !== 6 || isVerifying}
                  className="mb-4 mt-1 h-[48px] w-full rounded-lg bg-[#9a3bd9] text-[15px] font-medium text-white transition-all hover:bg-[#8a34c3] focus:outline-none focus:ring-2 focus:ring-[#9a3bd9] focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </button>

                <button
                  onClick={handleSendOtp}
                  disabled={isResendingOtp || resendTimer > 0}
                  className={`text-[13px] font-medium ${
                    isResendingOtp || resendTimer > 0
                      ? "text-[#b7b5b8] cursor-not-allowed"
                      : "text-[#9a3bd9] hover:underline"
                  } transition-colors focus:outline-none`}
                  aria-label="Resend verification code"
                >
                  {isResendingOtp ? "Sending..." : resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && <CustomToast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </PublicRoute>
  );
}
