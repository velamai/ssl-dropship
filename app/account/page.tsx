"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Bell, CreditCard, MapPin, LogOut, Edit, Check, X, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { auth } from "@/lib/auth";

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+94 71 234 5678",
    addressLine1: "123 Main Street",
    addressLine2: "Apartment 4B",
    city: "Colombo",
    postalCode: "10300",
    country: "Sri Lanka",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveChanges = () => {
    // Save changes logic would go here
    setIsEditing(false);
    setShowSuccessMessage(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleSignOut = () => {
    // Remove the auth token
    auth.removeToken();

    // Redirect to login page
    router.push("/login");
  };

  return (
    <ProtectedRoute>
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
              <h1 className="text-2xl font-bold text-[#3f3f3f]">Account Settings</h1>
              <p className="text-[#a2a2a2]">Manage your personal information and preferences</p>
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
                      onClick={() => setActiveTab("payment")}
                      className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                        activeTab === "payment"
                          ? "bg-[#f5e5ff] text-[#9c4cd2] font-medium"
                          : "text-[#3f3f3f] hover:bg-[#fefcff]"
                      }`}
                    >
                      <CreditCard size={16} className="mr-2" />
                      Payment Methods
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
                      onClick={handleSignOut}
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
                        <h2 className="text-lg font-medium text-[#3f3f3f]">Personal Information</h2>
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
                              onClick={handleSaveChanges}
                              className="flex items-center rounded-md bg-[#9c4cd2] px-3 py-1.5 text-sm font-medium text-white"
                            >
                              <Check size={14} className="mr-1.5" />
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <form onSubmit={handleSaveChanges}>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label htmlFor="firstName" className="block text-[14px] font-medium text-[#3f3f3f]">
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
                                  isEditing ? "focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]" : "opacity-80"
                                }`}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="lastName" className="block text-[14px] font-medium text-[#3f3f3f]">
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
                                  isEditing ? "focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]" : "opacity-80"
                                }`}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="email" className="block text-[14px] font-medium text-[#3f3f3f]">
                                Email Address
                              </label>
                              <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-[#fcfcfc] px-3.5 text-[14px] outline-none ${
                                  isEditing ? "focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]" : "opacity-80"
                                }`}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="phone" className="block text-[14px] font-medium text-[#3f3f3f]">
                                Phone Number
                              </label>
                              <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`h-[46px] w-full rounded-lg border border-[#e2e2e2] bg-[#fcfcfc] px-3.5 text-[14px] outline-none ${
                                  isEditing ? "focus:border-[#9c4cd2] focus:ring-1 focus:ring-[#9c4cd2]" : "opacity-80"
                                }`}
                              />
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
                        <h2 className="text-lg font-medium text-[#3f3f3f]">Security</h2>
                      </div>
                      <div className="p-4">
                        <div className="space-y-6">
                          <div className="rounded-lg border border-[#e2e2e2] p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-[#3f3f3f]">Password</h3>
                                <p className="text-sm text-[#a2a2a2]">Last changed 3 months ago</p>
                              </div>
                              <button className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]">
                                Change
                              </button>
                            </div>
                          </div>

                          <div className="rounded-lg border border-[#e2e2e2] p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-[#3f3f3f]">Two-Factor Authentication</h3>
                                <p className="text-sm text-[#a2a2a2]">Add an extra layer of security to your account</p>
                              </div>
                              <button className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]">
                                Enable
                              </button>
                            </div>
                          </div>

                          <div className="rounded-lg border border-[#e2e2e2] p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-[#3f3f3f]">Login History</h3>
                                <p className="text-sm text-[#a2a2a2]">View your recent login activity</p>
                              </div>
                              <button className="flex items-center rounded-md bg-[#f5e5ff] px-3 py-1.5 text-sm font-medium text-[#9c4cd2]">
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <div>
                      <div className="border-b border-[#e2e2e2] p-4">
                        <h2 className="text-lg font-medium text-[#3f3f3f]">Notification Preferences</h2>
                      </div>
                      <div className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <h3 className="font-medium text-[#3f3f3f]">Shipment Updates</h3>
                              <p className="text-sm text-[#a2a2a2]">Receive notifications about your shipment status</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input type="checkbox" className="peer sr-only" defaultChecked />
                              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#9c4cd2] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <h3 className="font-medium text-[#3f3f3f]">Email Notifications</h3>
                              <p className="text-sm text-[#a2a2a2]">Receive email updates about your account</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input type="checkbox" className="peer sr-only" defaultChecked />
                              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#9c4cd2] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <h3 className="font-medium text-[#3f3f3f]">SMS Notifications</h3>
                              <p className="text-sm text-[#a2a2a2]">Receive text messages for important updates</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input type="checkbox" className="peer sr-only" />
                              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#9c4cd2] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <h3 className="font-medium text-[#3f3f3f]">Marketing Communications</h3>
                              <p className="text-sm text-[#a2a2a2]">Receive promotional offers and updates</p>
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

                  {/* Payment Methods Tab */}
                  {activeTab === "payment" && (
                    <div>
                      <div className="border-b border-[#e2e2e2] p-4">
                        <h2 className="text-lg font-medium text-[#3f3f3f]">Payment Methods</h2>
                      </div>
                      <div className="p-4">
                        <div className="mb-4 flex justify-end">
                          <button className="flex items-center rounded-md bg-[#9c4cd2] px-3 py-1.5 text-sm font-medium text-white">
                            Add Payment Method
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-lg border border-[#e2e2e2] p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                                  <CreditCard size={20} />
                                </div>
                                <div className="ml-3">
                                  <h3 className="font-medium text-[#3f3f3f]">Visa ending in 4242</h3>
                                  <p className="text-sm text-[#a2a2a2]">Expires 12/2025</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-[#0FA95B]/10 px-2 py-0.5 text-xs font-medium text-[#0FA95B]">
                                  Default
                                </span>
                                <button className="text-[#a2a2a2] hover:text-[#3f3f3f]">
                                  <Edit size={16} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-[#e2e2e2] p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-100 text-red-600">
                                  <CreditCard size={20} />
                                </div>
                                <div className="ml-3">
                                  <h3 className="font-medium text-[#3f3f3f]">Mastercard ending in 8888</h3>
                                  <p className="text-sm text-[#a2a2a2]">Expires 08/2024</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="text-[#a2a2a2] hover:text-[#3f3f3f]">
                                  <Edit size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Addresses Tab */}
                  {activeTab === "address" && (
                    <div>
                      <div className="border-b border-[#e2e2e2] p-4">
                        <h2 className="text-lg font-medium text-[#3f3f3f]">Saved Addresses</h2>
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
                                  <h3 className="font-medium text-[#3f3f3f]">Home</h3>
                                  <span className="ml-2 rounded-full bg-[#0FA95B]/10 px-2 py-0.5 text-xs font-medium text-[#0FA95B]">
                                    Default
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-[#3f3f3f]">{formData.addressLine1}</p>
                                {formData.addressLine2 && (
                                  <p className="text-sm text-[#3f3f3f]">{formData.addressLine2}</p>
                                )}
                                <p className="text-sm text-[#3f3f3f]">
                                  {formData.city}, {formData.postalCode}
                                </p>
                                <p className="text-sm text-[#3f3f3f]">{formData.country}</p>
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
                                <h3 className="font-medium text-[#3f3f3f]">Office</h3>
                                <p className="mt-1 text-sm text-[#3f3f3f]">456 Business Avenue</p>
                                <p className="text-sm text-[#3f3f3f]">Suite 789</p>
                                <p className="text-sm text-[#3f3f3f]">Colombo, 10500</p>
                                <p className="text-sm text-[#3f3f3f]">Sri Lanka</p>
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
    </ProtectedRoute>
  );
}
