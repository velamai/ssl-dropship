"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Lock,
  Bell,
  CreditCard,
  MapPin,
  LogOut,
  Edit,
  Check,
  X,
  ChevronLeft,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { PhoneInput } from "@/components/ui/phone-input";
import { IdentityVerificationV2 } from "@/components/identity-verification-v2";
import { parsePhoneNumber } from "react-phone-number-input";
import { toast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// User data fetching function
const fetchUserData = async (userId: string) => {
  const supabase = getSupabaseBrowserClient();

  // Get user session to access metadata
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("User not found");
  }

  const authData = user.user_metadata;

  // Construct phone number in international format if country_code exists
  let phoneNumber = "";
  if (authData.phone_number && authData.country_code) {
    phoneNumber = `+${authData.country_code}${authData.phone_number}`;
  } else if (authData.phone_number_international) {
    phoneNumber = authData.phone_number_international;
  } else if (authData.phone_number) {
    phoneNumber = authData.phone_number;
  }

  return {
    firstName: authData.first_name || "",
    lastName: authData.last_name || "",
    email: user.email || "",
    phone: phoneNumber,
    // These would come from a separate addresses table if implemented
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: authData.country || "",
    rawUserData: authData,
  };
};

// User data update function
const updateUserProfile = async (profileData: {
  firstName: string;
  lastName: string;
  phone: string;
}) => {
  const supabase = getSupabaseBrowserClient();

  // Extract phone details
  let phoneDetails = { nationalNumber: "", countryCode: "", country: "" };
  if (profileData.phone) {
    try {
      const phoneNumber = parsePhoneNumber(profileData.phone);
      if (phoneNumber) {
        phoneDetails = {
          nationalNumber: phoneNumber.nationalNumber,
          countryCode: phoneNumber.countryCallingCode,
          country: phoneNumber.country || "",
        };
      }
    } catch (error) {
      console.error("Error parsing phone number:", error);
    }
  }

  // Update user metadata
  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: profileData.firstName.trim(),
      last_name: profileData.lastName.trim(),
      full_name: `${profileData.firstName.trim()} ${profileData.lastName.trim()}`,
      phone_number: phoneDetails.nationalNumber,
      country_code: phoneDetails.countryCode,
      country: phoneDetails.country,
      phone_number_international: profileData.phone,
    },
  });

  if (error) {
    throw error;
  }

  return { success: true };
};

const fetchIdentityVerificationData = async (userId: string) => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("users")
    .select("identity_verification_id, is_identity_verified")
    .eq("user_id", userId)
    .single();
  if (error) {
    throw error;
  }

  return { data };
};

export default function AccountPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // React Query for fetching user data
  const {
    data: userData,
    isLoading: userDataLoading,
    error: userDataError,
    refetch: refetchUserData,
  } = useQuery({
    queryKey: ["userData", user?.id],
    queryFn: () => fetchUserData(user?.id || ""),
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: identityVerificationData,
    isLoading: identityVerificationLoading,
  } = useQuery({
    queryKey: ["identityVerificationData", user?.id],
    queryFn: () => fetchIdentityVerificationData(user?.id || ""),
    enabled: !!user?.id && !authLoading && activeTab === "security",
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      setIsEditing(false);
      setShowSuccessMessage(true);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    },
    onError: (error: any) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description:
          error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
  });

  // Update form data when user data is loaded
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        addressLine1: userData.addressLine1,
        addressLine2: userData.addressLine2,
        city: userData.city,
        postalCode: userData.postalCode,
        country: userData.country,
      });
    }
  }, [userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData({
      ...formData,
      phone: value || "",
    });
  };

  const handleSaveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    updateProfileMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    });
  };

  // Show loading state while fetching data
  if (authLoading || userDataLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Navbar activePage="account" />
        <main className="flex-1 bg-[#fefcff] px-4 py-8 md:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c4cd2] mx-auto mb-4"></div>
                <p className="text-[#a2a2a2]">
                  Loading your account information...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error if user is not authenticated or if there's an error fetching data
  if (!user || userDataError) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Navbar activePage="account" />
        <main className="flex-1 bg-[#fefcff] px-4 py-8 md:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-12">
              {!user ? (
                <>
                  <p className="text-[#a2a2a2]">
                    Please log in to view your account information.
                  </p>
                  <Link
                    href="/login"
                    className="text-[#9c4cd2] hover:underline mt-2 inline-block"
                  >
                    Go to Login
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[#a2a2a2]">
                    Failed to load your account information.
                  </p>
                  <button
                    onClick={() => refetchUserData()}
                    className="text-[#9c4cd2] hover:underline mt-2 inline-block"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Use the Navbar component with account as active page */}
      <Navbar activePage="account" />

      {/* Main Content */}
      <main className="flex-1 bg-[#fefcff] px-4 py-8 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Mobile Back Button */}
          <div className="mb-4 block md:hidden">
            <Link href="/" className="flex items-center text-sm text-[#3f3f3f]">
              <ChevronLeft size={16} className="mr-1" />
              Back to Dashboard
            </Link>
          </div>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#3f3f3f]">
              Account Settings
            </h1>
            <p className="text-[#a2a2a2]">
              Manage your personal information and preferences
            </p>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 flex items-center rounded-lg bg-[#0FA95B]/10 p-4 text-[#0FA95B]">
              <Check size={18} className="mr-2" />
              <span>Your changes have been saved successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="rounded-lg border border-[#e2e2e2] bg-white overflow-hidden">
                <div className="p-4 border-b border-[#e2e2e2]">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9c4cd2]/10 text-[#9c4cd2]">
                      <User size={20} />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-[#3f3f3f]">
                        {formData.firstName} {formData.lastName}
                      </p>
                      <p className="text-xs text-[#a2a2a2]">{formData.email}</p>
                    </div>
                  </div>
                </div>
                <nav className="p-2">
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                      activeTab === "personal"
                        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                        : "text-[#3f3f3f] hover:bg-[#fefcff]"
                    }`}
                  >
                    <User size={16} className="mr-2" />
                    Personal Information
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                      activeTab === "security"
                        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                        : "text-[#3f3f3f] hover:bg-[#fefcff]"
                    }`}
                  >
                    <Lock size={16} className="mr-2" />
                    Security
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                      activeTab === "notifications"
                        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                        : "text-[#3f3f3f] hover:bg-[#fefcff]"
                    }`}
                  >
                    <Bell size={16} className="mr-2" />
                    Notifications
                  </button>

                  <button
                    onClick={() => setActiveTab("address")}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                      activeTab === "address"
                        ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                        : "text-[#3f3f3f] hover:bg-[#fefcff]"
                    }`}
                  >
                    <MapPin size={16} className="mr-2" />
                    Addresses
                  </button>
                </nav>
                <div className="border-t border-[#e2e2e2] p-2">
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-3">
              <div className="rounded-lg border border-[#e2e2e2] bg-white">
                {/* Personal Information Tab */}
                {activeTab === "personal" && (
                  <div>
                    <div className="flex items-center justify-between border-b border-[#e2e2e2] p-4">
                      <h2 className="text-lg font-medium text-[#3f3f3f]">
                        Personal Information
                      </h2>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]"
                        >
                          <Edit size={14} className="mr-1.5" />
                          Edit
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-[#3f3f3f]"
                          >
                            <X size={14} className="mr-1.5" />
                            Cancel
                          </button>
                          <button
                            // onClick={(e) => handleSaveChanges(e)}
                            disabled={updateProfileMutation.isPending}
                            className="flex items-center rounded-md bg-[#9c4cd2] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-70"
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check size={14} className="mr-1.5" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <form onSubmit={handleSaveChanges}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-[#fcfcfc] px-3.5 text-[14px] outline-none ${
                                isEditing
                                  ? "focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]"
                                  : "opacity-80"
                              }`}
                            />
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
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-[#fcfcfc] px-3.5 text-[14px] outline-none ${
                                isEditing
                                  ? "focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]"
                                  : "opacity-80"
                              }`}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor="email"
                              className="block text-[14px] font-medium text-[#3f3f3f]"
                            >
                              Email Address
                            </label>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              disabled={true}
                              className="h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-[#fcfcfc] px-3.5 text-[14px] outline-none opacity-80 cursor-not-allowed"
                            />
                            <p className="text-[12px] text-[#a2a2a2]">
                              Email address cannot be changed
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor="phone"
                              className="block text-[14px] font-medium text-[#3f3f3f]"
                            >
                              Phone Number
                            </label>
                            {isEditing ? (
                              <PhoneInput
                                id="phone"
                                placeholder="Enter your phone number"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                defaultCountry="IN"
                                international
                                countryCallingCodeEditable={false}
                                className="[&_input]:h-[46px] [&_input]:bg-[#fcfcfc] [&_input]:text-[14px] [&_button]:h-[46px] [&_button]:bg-[#fcfcfc] [&_input]:border-[#e2e2e2] [&_input]:focus:border-[#9c4cd2] [&_input]:focus:ring-[#9c4cd2] [&_button]:border-[#e2e2e2] [&_button]:focus:border-[#9c4cd2]"
                              />
                            ) : (
                              <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                disabled={true}
                                className="h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-[#fcfcfc] px-3.5 text-[14px] outline-none opacity-80"
                              />
                            )}
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div>
                    <div className="border-b border-[#e2e2e2] p-4">
                      <h2 className="text-lg font-medium text-[#3f3f3f]">
                        Security
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="space-y-6">
                        <div className="rounded-lg border border-[#e2e2e2] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-[#3f3f3f]">
                                Password
                              </h3>
                              <p className="text-sm text-[#a2a2a2]">
                                Last changed 3 months ago
                              </p>
                            </div>
                            <button className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]">
                              Change
                            </button>
                          </div>
                        </div>

                        <IdentityVerificationV2
                          isVerified={
                            identityVerificationData?.data?.is_identity_verified
                          }
                          identityVerificationId={
                            identityVerificationData?.data
                              ?.identity_verification_id
                          }
                          userId={user?.id}
                          isLoading={identityVerificationLoading}
                        />

                        {/* <div className="rounded-lg border border-[#e2e2e2] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-[#3f3f3f]">
                                Two-Factor Authentication
                              </h3>
                              <p className="text-sm text-[#a2a2a2]">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                            <button className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]">
                              Enable
                            </button>
                          </div>
                        </div>

                        <div className="rounded-lg border border-[#e2e2e2] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-[#3f3f3f]">
                                Login History
                              </h3>
                              <p className="text-sm text-[#a2a2a2]">
                                View your recent login activity
                              </p>
                            </div>
                            <button className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]">
                              View
                            </button>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div>
                    <div className="border-b border-[#e2e2e2] p-4">
                      <h2 className="text-lg font-medium text-[#3f3f3f]">
                        Notification Preferences
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <h3 className="font-medium text-[#3f3f3f]">
                              Email Notifications
                            </h3>
                            <p className="text-sm text-[#a2a2a2]">
                              Receive email updates about your account
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              defaultChecked
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#9c4cd2] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div>
                            <h3 className="font-medium text-[#3f3f3f]">
                              SMS Notifications
                            </h3>
                            <p className="text-sm text-[#a2a2a2]">
                              Receive text messages for important updates
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" className="peer sr-only" />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#9c4cd2] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div>
                            <h3 className="font-medium text-[#3f3f3f]">
                              Marketing Communications
                            </h3>
                            <p className="text-sm text-[#a2a2a2]">
                              Receive promotional offers and updates
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" className="peer sr-only" />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#9c4cd2] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === "address" && (
                  <div>
                    <div className="border-b border-[#e2e2e2] p-4">
                      <h2 className="text-lg font-medium text-[#3f3f3f]">
                        Saved Addresses
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="mb-4 flex justify-end">
                        <button className="flex items-center rounded-md bg-[#9c4cd2] px-3 py-1.5 text-sm font-medium text-white">
                          Add New Address
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-lg border border-[#e2e2e2] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <h3 className="font-medium text-[#3f3f3f]">
                                  Home
                                </h3>
                                <span className="ml-2 rounded-full bg-[#0FA95B]/10 px-2 py-0.5 text-xs font-medium text-[#0FA95B]">
                                  Default
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[#3f3f3f]">
                                {formData.addressLine1}
                              </p>
                              {formData.addressLine2 && (
                                <p className="text-sm text-[#3f3f3f]">
                                  {formData.addressLine2}
                                </p>
                              )}
                              <p className="text-sm text-[#3f3f3f]">
                                {formData.city}, {formData.postalCode}
                              </p>
                              <p className="text-sm text-[#3f3f3f]">
                                {formData.country}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]">
                                <Edit size={14} className="mr-1.5" />
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-[#e2e2e2] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-[#3f3f3f]">
                                Office
                              </h3>
                              <p className="mt-1 text-sm text-[#3f3f3f]">
                                456 Business Avenue
                              </p>
                              <p className="text-sm text-[#3f3f3f]">
                                Suite 789
                              </p>
                              <p className="text-sm text-[#3f3f3f]">
                                Colombo, 10500
                              </p>
                              <p className="text-sm text-[#3f3f3f]">
                                Sri Lanka
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]">
                                <Edit size={14} className="mr-1.5" />
                                Edit
                              </button>
                              <button className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-[#3f3f3f] hover:bg-gray-100">
                                Set as Default
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
