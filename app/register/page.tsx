"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { parsePhoneNumber, isValidPhoneNumber } from "react-phone-number-input";
import { IdentityVerification } from "@/components/identity-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchCountries } from "@/lib/api-client";

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

// Helper function to upload file to R2 using signed URL
async function uploadFileToR2(file: File): Promise<string> {
  // Get signed URL
  const signedUrlResponse = await fetch(
    "/api/identity-verification-signed-url",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileType: file.type,
      }),
    }
  );

  if (!signedUrlResponse.ok) {
    const errorData = await signedUrlResponse.json();
    throw new Error(errorData.error || "Failed to get upload URL");
  }

  const { signedUrl, key } = await signedUrlResponse.json();

  // Upload file directly to R2
  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to storage");
  }

  return key;
}

// Form data interface
interface FormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;

  // Step 2: Address Information
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  country: string;
  pincode: string;

  // Step 3: Identity Verification
  identityVerification: {
    proofType: string;
    frontImage: File | null;
    backImage: File | null;
    frontImageUrl: string;
    backImageUrl: string;
  };
}

// Step validation functions
const validateStep1 = (formData: FormData): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  if (!formData.firstName.trim()) {
    errors.firstName = "First name is required";
  } else if (formData.firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters long";
  }

  if (!formData.lastName.trim()) {
    errors.lastName = "Last name is required";
  } else if (formData.lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters long";
  }

  if (!formData.email.trim()) {
    errors.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  const phoneError = validatePhoneNumber(formData.phoneNumber);
  if (phoneError) {
    errors.phoneNumber = phoneError;
  }

  if (!formData.password) {
    errors.password = "Password is required";
  } else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters long";
  }

  return errors;
};

const validateStep2 = (formData: FormData): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  if (!formData.addressLine1.trim()) {
    errors.addressLine1 = "Address line 1 is required";
  }
  if (!formData.addressLine2.trim()) {
    errors.addressLine2 = "Address line 2 is required";
  }

  if (!formData.country.trim()) {
    errors.country = "Country is required";
  }

  return errors;
};

// const validateStep3 = (formData: FormData): { [key: string]: string } => {
//   const errors: { [key: string]: string } = {};

//   if (!formData.identityVerification.proofType) {
//     errors.proofType = "Please select a document type";
//   }

//   if (!formData.identityVerification.frontImage) {
//     errors.frontImage = "Please upload the front side of your document";
//   }

//   // Check if back image is required based on proof type
//   const requiresBackImage = ["gov-id", "driving_license"].includes(
//     formData.identityVerification.proofType
//   );
//   if (requiresBackImage && !formData.identityVerification.backImage) {
//     errors.backImage = "Please upload the back side of your document";
//   }

//   return errors;
// };

// Session storage utilities
const SESSION_STORAGE_KEY = "registration_form_data";
const STEP_STORAGE_KEY = "registration_current_step";

const saveToSessionStorage = (data: Partial<FormData>) => {
  if (typeof window !== "undefined") {
    try {
      const existingData = getFromSessionStorage();
      const updatedData = { ...existingData, ...data };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error("Error saving to session storage:", error);
    }
  }
};

const saveCurrentStep = (step: number) => {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(STEP_STORAGE_KEY, step.toString());
    } catch (error) {
      console.error("Error saving current step:", error);
    }
  }
};

const getFromSessionStorage = (): Partial<FormData> => {
  if (typeof window !== "undefined") {
    try {
      const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error reading from session storage:", error);
      return {};
    }
  }
  return {};
};

const getCurrentStep = (): number => {
  if (typeof window !== "undefined") {
    try {
      const step = sessionStorage.getItem(STEP_STORAGE_KEY);
      return step ? parseInt(step, 10) : 1;
    } catch (error) {
      console.error("Error reading current step:", error);
      return 1;
    }
  }
  return 1;
};

const clearSessionStorage = () => {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(STEP_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing session storage:", error);
    }
  }
};

// Registration mutation function
const registerUser = async (userData: FormData) => {
  const supabase = getSupabaseBrowserClient();

  // Extract phone details
  const phoneDetails = getPhoneDetails(userData.phoneNumber);

  // Combine first and last name
  const fullName = `${userData.firstName.trim()} ${userData.lastName.trim()}`;

  console.log({ userData });

  console.log(
    JSON.stringify({
      // user_id: data.user.id,
      address_line1: userData.addressLine1,
      address_line2: userData.addressLine2,
      address_line3: userData.addressLine3,
      address_line4: userData.addressLine4,
      country: userData.country,
      pincode: userData.pincode,
      proofType: userData.identityVerification.proofType,
      frontImageUrl: userData.identityVerification.frontImageUrl,
      backImageUrl: userData.identityVerification.backImageUrl || null,
    })
  );

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
            address_line1: userData.addressLine1,
            address_line2: userData.addressLine2,
            address_line3: userData.addressLine3,
            address_line4: userData.addressLine4,
            country: userData.country,
            pincode: userData.pincode,
            proofType: userData.identityVerification.proofType,
            frontImageUrl: userData.identityVerification.frontImageUrl,
            backImageUrl: userData.identityVerification.backImageUrl || null,
            phone_number: phoneDetails.nationalNumber,
            phone_country_code: phoneDetails.countryCode,
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
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    addressLine4: "",
    country: "",
    pincode: "",
    identityVerification: {
      proofType: "",
      frontImage: null,
      backImage: null,
      frontImageUrl: "",
      backImageUrl: "",
    },
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);

  const {
    data: countries = [],
    isLoading: isCountriesLoading,
    isError: isCountriesError,
    error: countriesError,
    refetch: refetchCountries,
  } = useQuery<Array<{ code: string; name: string }>>({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 10,
  });

  const selectedCountry = countries?.find(
    (country: { code: string }) => country.code === formData.country
  );

  // Load data and current step from session storage on component mount
  useEffect(() => {
    const savedData = getFromSessionStorage();
    const savedStep = getCurrentStep();

    if (Object.keys(savedData).length > 0) {
      setFormData((prev) => ({ ...prev, ...savedData }));
    }

    if (savedStep > 1) {
      setCurrentStep(savedStep);
    }
  }, []);

  // Use React Query mutation
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async (data) => {
      console.log({ data });

      // // If user was created successfully and we have identity verification data, submit it
      // if (
      //   data.user?.id &&
      //   formData.identityVerification.proofType &&
      //   formData.identityVerification.frontImageUrl
      // ) {
      //   try {
      //     await submitIdentityVerification({
      //       userId: data.user.id,
      //       proofType: formData.identityVerification.proofType,
      //       frontImageUrl: formData.identityVerification.frontImageUrl,
      //       backImageUrl: formData.identityVerification.backImageUrl || null,
      //     });

      //     toast({
      //       title: "Registration successful",
      //       description:
      //         "Your account has been created and identity verification submitted. Please check your email for verification.",
      //       variant: "default",
      //     });
      //   } catch (verificationError) {
      //     console.error(
      //       "Identity verification submission failed:",
      //       verificationError
      //     );
      //     // Still show success for registration, but mention verification issue
      //     toast({
      //       title: "Registration successful",
      //       description:
      //         "Your account has been created. Identity verification will be processed separately. Please check your email for verification.",
      //       variant: "default",
      //     });
      //   }
      // } else {
      // }
      // Show inline success panel; do not change step count
      setIsUploadingFiles(false);
      clearSessionStorage();
      setRegistrationSuccess(true);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      setIsUploadingFiles(false);
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
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    saveToSessionStorage(updatedData);

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    const updatedData = { ...formData, phoneNumber: value || "" };
    setFormData(updatedData);
    saveToSessionStorage(updatedData);

    // Clear validation error for phone field when user starts typing
    if (validationErrors.phoneNumber) {
      setValidationErrors((prev) => ({ ...prev, phoneNumber: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log(name, value);
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    saveToSessionStorage(updatedData);

    // Clear validation error for this field when user makes selection
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleIdentityChange = (data: {
    proofType: string;
    frontImage: File | null;
    backImage: File | null;
  }) => {
    const updatedData = {
      ...formData,
      identityVerification: {
        ...formData.identityVerification,
        proofType: data.proofType,
        frontImage: data.frontImage,
        backImage: data.backImage,
      },
    };
    setFormData(updatedData);
    saveToSessionStorage(updatedData);

    setValidationErrors((prev) => {
      const next = { ...prev };
      if (!data.proofType) {
        delete next.proofType;
        delete next.frontImage;
        delete next.backImage;
      } else {
        delete next.proofType;
        if (data.frontImage) {
          delete next.frontImage;
        }
        if (data.backImage) {
          delete next.backImage;
        }
      }
      return next;
    });
  };

  const validateCurrentStep = () => {
    let errors: { [key: string]: string } = {};

    switch (currentStep) {
      case 1:
        errors = validateStep1(formData);
        break;
      case 2:
        errors = validateStep2(formData);
        break;
      case 3:
        // errors = validateStep3(formData);
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    saveCurrentStep(prevStep);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    // Validate identity inputs at submit time
    const { proofType, frontImage, backImage } = formData.identityVerification;
    const requiresBackImage = ["driving_license", "gov-id"].includes(proofType);

    // Upload documents first
    try {
      let payload = { ...formData };
      if (proofType) {
        if (!frontImage || (requiresBackImage && !backImage)) {
          setValidationErrors((prev) => ({
            ...prev,
            ...(frontImage
              ? {}
              : {
                  frontImage: "Please upload the front side of your document",
                }),
            ...(requiresBackImage && !backImage
              ? { backImage: "Please upload the back side of your document" }
              : {}),
          }));
          return;
        }
        setIsUploadingFiles(true);
        const frontImageUrl = await uploadFileToR2(frontImage as File);
        let backImageUrl = "";
        if (backImage) {
          backImageUrl = await uploadFileToR2(backImage as File);
        }

        payload = {
          ...formData,
          identityVerification: {
            ...formData.identityVerification,
            frontImageUrl,
            backImageUrl,
          },
        };

        setFormData(payload);
      }
      registerMutation.mutate(payload);
    } catch (error) {
      console.error("Identity upload failed:", error);
      setIsUploadingFiles(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="firstName"
                  className="text-[14px] font-medium text-[#3f3f3f]"
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className={`h-[46px] bg-[#fcfcfc] text-[14px] ${
                    validationErrors.firstName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                  }`}
                />
                {validationErrors.firstName && (
                  <p className="text-[12px] text-red-600 mt-1">
                    {validationErrors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="lastName"
                  className="text-[14px] font-medium text-[#3f3f3f]"
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className={`h-[46px] bg-[#fcfcfc] text-[14px] ${
                    validationErrors.lastName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                  }`}
                />
                {validationErrors.lastName && (
                  <p className="text-[12px] text-red-600 mt-1">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[14px] font-medium text-[#3f3f3f]"
              >
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={`h-[46px] bg-[#fcfcfc] text-[14px] ${
                  validationErrors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                }`}
              />
              {validationErrors.email && (
                <p className="text-[12px] text-red-600 mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="phoneNumber"
                className="text-[14px] font-medium text-[#3f3f3f]"
              >
                Phone Number
              </Label>
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
              <Label
                htmlFor="password"
                className="text-[14px] font-medium text-[#3f3f3f]"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={`h-[46px] bg-[#fcfcfc] pr-12 text-[14px] ${
                    validationErrors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                  }`}
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="addressLine1"
                className="text-[14px] font-medium text-[#3f3f3f]"
              >
                Address Line 1 *
              </Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                type="text"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="Enter your address"
                className={`h-[46px] bg-[#fcfcfc] text-[14px] ${
                  validationErrors.addressLine1
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                }`}
              />
              {validationErrors.addressLine1 && (
                <p className="text-[12px] text-red-600 mt-1">
                  {validationErrors.addressLine1}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="addressLine2"
                className="text-[14px] font-medium text-[#3f3f3f]"
              >
                Address Line 2 *
              </Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                type="text"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Apartment, suite, etc"
                className={`h-[46px] bg-[#fcfcfc] text-[14px] ${
                  validationErrors.addressLine2
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                }`}
              />
              {validationErrors.addressLine2 && (
                <p className="text-[12px] text-red-600 mt-1">
                  {validationErrors.addressLine2}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="addressLine3"
                className="text-[14px] font-medium text-[#3f3f3f]"
              >
                Address Line 3
              </Label>
              <Input
                id="addressLine3"
                name="addressLine3"
                type="text"
                value={formData.addressLine3}
                onChange={handleChange}
                placeholder="City, state (optional)"
                className="h-[46px] bg-[#fcfcfc] text-[14px] border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="addressLine4"
                className="text-[14px] font-medium text-[#3f3f3f]"
              >
                Address Line 4
              </Label>
              <Input
                id="addressLine4"
                name="addressLine4"
                type="text"
                value={formData.addressLine4}
                onChange={handleChange}
                placeholder="Additional details (optional)"
                className="h-[46px] bg-[#fcfcfc] text-[14px] border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="country"
                  className="text-[14px] font-medium text-[#3f3f3f]"
                >
                  Country *
                </Label>
                <Popover
                  open={isCountrySelectOpen}
                  onOpenChange={setIsCountrySelectOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCountrySelectOpen}
                      className={cn(
                        "h-[46px] w-full justify-between bg-[#fcfcfc] text-left text-[14px]",
                        validationErrors.country
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                      )}
                      disabled={isCountriesLoading}
                    >
                      {isCountriesLoading ? (
                        <span className="flex items-center gap-2 text-[#6f6f6f]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading countries...
                        </span>
                      ) : selectedCountry ? (
                        selectedCountry.name
                      ) : (
                        "Select country"
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search country..."
                        disabled={isCountriesLoading}
                      />
                      <CommandList>
                        {isCountriesLoading ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                            <p className="mt-2">Loading countries...</p>
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries?.map(
                                (country: { code: string; name: string }) => (
                                  <CommandItem
                                    key={country.code}
                                    value={`${country.code} ${country.name}`}
                                    onSelect={() => {
                                      handleSelectChange(
                                        "country",
                                        country.code
                                      );
                                      setIsCountrySelectOpen(false);
                                    }}
                                  >
                                    <span className="flex-1">
                                      {country.name}
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-2 h-4 w-4",
                                        formData.country === country.code
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                )
                              )}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {isCountriesError && (
                  <div className="mt-1 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-600">
                    <span className="pr-2">
                      Unable to load countries. Please try again.
                    </span>
                    <button
                      type="button"
                      onClick={() => refetchCountries()}
                      className="text-[12px] font-medium underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {validationErrors.country && (
                  <p className="text-[12px] text-red-600 mt-1">
                    {validationErrors.country}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="pincode"
                  className="text-[14px] font-medium text-[#3f3f3f]"
                >
                  Pincode / Zipcode
                </Label>
                <Input
                  id="pincode"
                  name="pincode"
                  type="text"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                  className={`h-[46px] bg-[#fcfcfc] text-[14px] ${
                    validationErrors.pincode
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                  }`}
                />
                {validationErrors.pincode && (
                  <p className="text-[12px] text-red-600 mt-1">
                    {validationErrors.pincode}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 ">
            <IdentityVerification
              isVerified={false}
              onChange={handleIdentityChange}
            />

            {validationErrors.proofType && (
              <p className="text-[12px] text-red-600 mt-1">
                {validationErrors.proofType}
              </p>
            )}
            {validationErrors.frontImage && (
              <p className="text-[12px] text-red-600 mt-1">
                {validationErrors.frontImage}
              </p>
            )}
            {validationErrors.backImage && (
              <p className="text-[12px] text-red-600 mt-1">
                {validationErrors.backImage}
              </p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">Account created successfully</span>
            </div>
            <p className="text-sm">
              Please verify your email to sign in. Verification email has been
              sent to your inbox.
            </p>
            <div className="pt-2">
              <Link href="/" className="text-[#9c4cd2] hover:underline">
                Return to home
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden lg:flex-row">
      {/* Left Column - Illustration */}
      <div className="relative hidden w-full overflow-hidden rounded-r-[32px] bg-[#f5e5ff] lg:block lg:w-[45%]">
        {/* Logo */}
        <div className="absolute left-12 top-12 z-10">
          <div className="flex items-center gap-2">
            <div className="size-16">
              {/* <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="#E53935" />
                <path d="M10 15L30 15L20 35L10 15Z" fill="#B71C1C" />
                <path d="M20 0L30 15L10 15L20 0Z" fill="#E53935" />
              </svg> */}
              <Image src="logo.png" width={100} height={100} alt="logo" />
            </div>
            <div>
              <div className="font-bold leading-tight text-[#3f3f3f]">
                BUY2SEND
              </div>
              {/* <div className="-mt-1 text-xs font-medium text-[#E53935]">
                DROP & SHIP
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

      {/* Right Column - Registration Form */}
      <div className="flex w-full flex-col justify-between px-6 py-8 lg:w-[55%] lg:px-16 lg:py-12 xl:px-24 overflow-auto max-h-screen">
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
              UNIVERSAL
            </div>
            <div className="-mt-1 text-xs font-medium text-[#E53935]">MAIL</div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[550px]">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-[28px] font-medium leading-tight text-[#3f3f3f]">
              Create Account{" "}
              <span className=" font-bold text-[#9c4cd2]">BUY2SEND</span>
            </h1>
            {!registrationSuccess && (
              <p className="text-[14px] text-[#a2a2a2] mt-2">
                Step {currentStep} of 3:{" "}
                {currentStep === 1
                  ? "Personal Information"
                  : currentStep === 2
                  ? "Address Information"
                  : "Identity Verification (Optional)"}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {!registrationSuccess && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? "bg-[#9c4cd2] text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step < currentStep ? <Check size={16} /> : step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-[12.5rem] h-1 mx-2 rounded ${
                          step < currentStep ? "bg-[#9c4cd2]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {registerMutation.error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {(registerMutation.error as any)?.message ||
                "Failed to register. Please try again."}
            </div>
          )}

          <div className="space-y-5">
            {!registrationSuccess && renderStepContent()}

            {registrationSuccess && (
              <div className="mb-6 space-y-3 rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">
                    Account created successfully
                  </span>
                </div>
                <p className="text-sm">
                  Please verify your email to sign in. Verification email has
                  been sent to your inbox.
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            {!registrationSuccess && (
              <div
                className={cn(
                  "flex justify-between pt-6",
                  currentStep === 1 && "justify-end"
                )}
              >
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#9a3bd9] hover:bg-[#9a3bd9]/90 flex items-center gap-2"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                ) : currentStep === 3 ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={registerMutation.isPending || isUploadingFiles}
                    className="bg-[#9a3bd9] hover:bg-[#9a3bd9]/90"
                  >
                    {isUploadingFiles
                      ? "Creating Account..."
                      : registerMutation.isPending
                      ? "Creating Account..."
                      : "Create Account"}
                  </Button>
                ) : null}
              </div>
            )}

            {!registrationSuccess && (
              <div className="text-center text-[13px] text-[#a2a2a2]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#9c4cd2] font-medium hover:underline"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom decorative elements */}
        <div className="hidden lg:block absolute bottom-0 right-0 opacity-10 -z-30">
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
