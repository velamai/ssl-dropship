"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { parsePhoneNumber, isValidPhoneNumber } from "react-phone-number-input";

// International phone number validation and utilities
const getPhoneDetails = (phone: string) => {
  if (!phone)
    return { nationalNumber: "", countryCode: "", country: "", isValid: false };

  try {
    const phoneNumber = parsePhoneNumber(phone);
    if (phoneNumber) {
      return {
        nationalNumber: phoneNumber.nationalNumber,
        countryCode: phoneNumber.countryCallingCode,
        country: phoneNumber.country || "",
        isValid: phoneNumber.isValid(),
      };
    }
  } catch (error) {
    console.error("Error parsing phone number:", error);
  }

  return { nationalNumber: "", countryCode: "", country: "", isValid: false };
};

const validatePhoneNumber = (phone: string): string | null => {
  if (!phone) {
    return "Phone number is required";
  }

  // Use react-phone-number-input validation
  if (!isValidPhoneNumber(phone)) {
    return "Please enter a valid phone number";
  }

  return null;
};

// Form validation
const validateForm = (formData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  // First name validation
  if (!formData.firstName.trim()) {
    errors.firstName = "First name is required";
  } else if (formData.firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters long";
  }

  // Last name validation
  if (!formData.lastName.trim()) {
    errors.lastName = "Last name is required";
  } else if (formData.lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters long";
  }

  // Email validation
  if (!formData.email.trim()) {
    errors.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  // Phone number validation
  const phoneError = validatePhoneNumber(formData.phoneNumber);
  if (phoneError) {
    errors.phoneNumber = phoneError;
  }

  // Password validation
  if (!formData.password) {
    errors.password = "Password is required";
  } else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters long";
  }

  return errors;
};

// Registration mutation function
const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}) => {
  const supabase = getSupabaseBrowserClient();

  // Extract phone details
  const phoneDetails = getPhoneDetails(userData.phoneNumber);

  // Combine first and last name
  const fullName = `${userData.firstName.trim()} ${userData.lastName.trim()}`;

  // First, register with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        full_name: fullName,
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        phone_number: phoneDetails.nationalNumber,
        country_code: phoneDetails.countryCode,
      },
    },
  });

  console.log({ data });

  if (error) {
    throw error;
  }

  // If registration was successful and we have a user, call the logistics endpoint
  if (data.user?.id) {
    try {
      const { data: logisticsData, error: logisticsError } =
        await supabase.functions.invoke("drop-ship-register", {
          body: {
            user_id: data.user.id,
            phone_number: phoneDetails.nationalNumber || "",
            phone_country_code: phoneDetails.countryCode || "",
          },
        });

      if (logisticsError) {
        console.error(
          "Failed to register with logistics service:",
          logisticsError
        );
      } else {
        console.log(
          "Successfully registered with logistics service",
          logisticsData
        );
      }
    } catch (logisticsError) {
      console.error("Error calling logistics registration:", logisticsError);
    }
  }

  return data;
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Use React Query mutation
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast({
        title: "Registration successful",
        description:
          "Your account has been created. Please check your email for verification.",
        variant: "default",
      });
      router.push("/");
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register. Please try again.",
        variant: "destructive",
      });
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData((prev) => ({ ...prev, phoneNumber: value || "" }));

    // Clear validation error for phone field when user starts typing
    if (validationErrors.phoneNumber) {
      setValidationErrors((prev) => ({ ...prev, phoneNumber: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear any previous validation errors
    setValidationErrors({});
    registerMutation.mutate(formData);
  };

  return (
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
                COLOMBO
              </div>
              <div className="-mt-1 text-xs font-medium text-[#E53935]">
                DROP SHIP
              </div>
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
            {/* Small cloud top left */}
            <div className="absolute left-[50px] top-[100px] h-[20px] w-[40px] rounded-[10px] bg-white"></div>

            {/* Medium cloud left */}
            <div className="absolute left-[20px] top-[180px] h-[25px] w-[80px] rounded-[12px] bg-white"></div>

            {/* Medium cloud top */}
            <div className="absolute left-[150px] top-[60px] h-[25px] w-[60px] rounded-[12px] bg-white"></div>

            {/* Large cloud top right */}
            <div className="absolute right-[80px] top-[80px] h-[30px] w-[120px] rounded-[15px] bg-white"></div>

            {/* Medium cloud bottom left */}
            <div className="absolute bottom-[120px] left-[60px] h-[25px] w-[70px] rounded-[12px] bg-white"></div>

            {/* Large cloud bottom right */}
            <div className="absolute bottom-[80px] right-[40px] h-[30px] w-[110px] rounded-[15px] bg-white"></div>
          </div>
        </div>
      </div>

      {/* Right Column - Registration Form */}
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
              DROP SHIP
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[380px]">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-[28px] font-medium leading-tight text-[#3f3f3f]">
              Create Account
            </h1>
            <h2 className="text-[32px] font-bold text-[#9c4cd2]">
              Colombo Drop Ship
            </h2>
            <p className="text-[14px] text-[#a2a2a2] mt-2">
              Please enter your email and password to proceed
            </p>
          </div>

          {registerMutation.error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {(registerMutation.error as any)?.message ||
                "Failed to register. Please try again."}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="firstName"
                  className="block text-[14px] font-medium text-[#3f3f3f]"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className={`h-[46px] w-full rounded-lg border bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:ring-1 ${
                    validationErrors.firstName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                  }`}
                  required
                />
                {validationErrors.firstName && (
                  <p className="text-[12px] text-red-600 mt-1">
                    {validationErrors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="lastName"
                  className="block text-[14px] font-medium text-[#3f3f3f]"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className={`h-[46px] w-full rounded-lg border bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:ring-1 ${
                    validationErrors.lastName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                  }`}
                  required
                />
                {validationErrors.lastName && (
                  <p className="text-[12px] text-red-600 mt-1">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>

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
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={`h-[46px] w-full rounded-lg border bg-[#fcfcfc] px-3.5 text-[14px] outline-none focus:ring-1 ${
                  validationErrors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                }`}
                required
              />
              {validationErrors.email && (
                <p className="text-[12px] text-red-600 mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="phoneNumber"
                className="block text-[14px] font-medium text-[#3f3f3f]"
              >
                Phone Number
              </label>
              <PhoneInput
                id="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                defaultCountry="IN"
                international
                countryCallingCodeEditable={false}
                className={`${
                  validationErrors.phoneNumber
                    ? "[&_input]:border-red-500 [&_input]:focus:border-red-500 [&_input]:focus:ring-red-500 [&_button]:border-red-500"
                    : "[&_input]:border-[#e2e2e2] [&_input]:focus:border-[#9c4cd2] [&_input]:focus:ring-[#9c4cd2] [&_button]:border-[#e2e2e2] [&_button]:focus:border-[#9c4cd2]"
                } [&_input]:h-[46px] [&_input]:bg-[#fcfcfc] [&_input]:text-[14px] [&_button]:h-[46px] [&_button]:bg-[#fcfcfc]`}
              />
              {validationErrors.phoneNumber && (
                <p className="text-[12px] text-red-600 mt-1">
                  {validationErrors.phoneNumber}
                </p>
              )}
              {!validationErrors.phoneNumber && (
                <p className="text-[12px] text-[#a2a2a2] mt-1">
                  International phone numbers supported
                </p>
              )}
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
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={`h-[46px] w-full rounded-lg border bg-[#fcfcfc] px-3.5 pr-12 text-[14px] outline-none focus:ring-1 ${
                    validationErrors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                  }`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a2a2a2] hover:text-[#3f3f3f]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-[12px] text-red-600 mt-1">
                  {validationErrors.password}
                </p>
              )}
              {!validationErrors.password && (
                <p className="text-[12px] text-[#a2a2a2] mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="h-[46px] w-full rounded-lg bg-[#9a3bd9] text-[14px] font-medium text-white transition-colors hover:bg-[#9a3bd9]/90 disabled:opacity-70"
            >
              {registerMutation.isPending
                ? "Creating Account..."
                : "Create Account"}
            </button>

            <div className="text-center text-[13px] text-[#a2a2a2]">
              Already have an account?{" "}
              <Link
                href="/"
                className="text-[#9c4cd2] font-medium hover:underline"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom decorative elements */}
        <div className="hidden lg:block absolute bottom-0 right-0 opacity-10 -z-50">
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
  );
}
