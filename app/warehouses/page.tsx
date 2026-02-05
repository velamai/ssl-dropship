"use client";

import { CountryFlag } from "@/components/country-flag";
import { Navbar } from "@/components/navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WarehouseListSkeleton } from "@/components/ui/warehouse-skeleton";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { Warehouse } from "@/lib/types/warehouse";
import { getCountryCode } from "@/lib/utils";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Globe,
  Mail,
  MapPin,
  Phone,
  Search,
  User2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function AddressesPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch warehouses using React Query
  const { data: warehouses, isLoading, error, refetch } = useWarehouses();


  const copyToClipboard = (text: string, identifier: string) => {
    if (text === "") return;
    navigator.clipboard.writeText(text);
    setCopiedAddress(identifier);

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
  };

  // Filter warehouses based on search query
  const filteredWarehouses = useMemo(() => {
    if (!warehouses?.data) return [];

    return warehouses.data.filter((warehouse) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (warehouse.name?.toLowerCase().includes(searchLower) ?? false) ||
        warehouse.address_line1.toLowerCase().includes(searchLower) ||
        (warehouse.address_line2?.toLowerCase().includes(searchLower) ??
          false) ||
        (warehouse.address_line3?.toLowerCase().includes(searchLower) ??
          false) ||
        (warehouse.address_line4?.toLowerCase().includes(searchLower) ??
          false) ||
        warehouse.country.toLowerCase().includes(searchLower) ||
        (warehouse.postal_code &&
          warehouse.postal_code.toLowerCase().includes(searchLower)) ||
        (warehouses?.userFirstName?.toLowerCase().includes(searchLower) ??
          false) ||
        (warehouses?.userLastName?.toLowerCase().includes(searchLower) ?? false)
      );
    });
  }, [
    warehouses?.data,
    warehouses?.userFirstName,
    warehouses?.userLastName,
    searchQuery,
  ]);

  // Helper function to get the first non-null address line for city display
  const getCityFromAddress = (warehouse: Warehouse): string => {
    // Try to extract city from address lines or use a default
    const addressLines = [
      warehouse.address_line2,
      warehouse.address_line3,
      warehouse.address_line4,
    ].filter(Boolean);

    return addressLines[0] || `Area ${warehouse.postal_code}`;
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar activePage="warehouses" />

        <main className="flex-1 bg-gradient-to-br from-slate-50 to-purple-50/30 px-4 py-8 md:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            {/* Mobile Back Button */}
            <div className="mb-6 block md:hidden">
              <Link
                href="/shipments"
                className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft size={16} className="mr-1" />
                Back to Orders
              </Link>
            </div>

            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-slate-900">
                    Warehouse Addresses
                  </h1>
                  <p className="text-slate-600 text-lg">
                    Manage and copy warehouse addresses for your shipments
                  </p>
                </div>

                <div className="relative w-full lg:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search warehouses..."
                    className="pl-10 h-11 border-slate-200 bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && <WarehouseListSkeleton count={6} />}

            {/* Error State */}
            {error && (
              <Alert className="mb-8 border-red-200 bg-red-50/50 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 flex items-center justify-between">
                  <span className="font-medium">
                    Failed to load warehouses. Please try again.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Data State */}
            {!isLoading && !error && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredWarehouses.map((warehouse) => (
                  <Card
                    key={warehouse.warehouse_id}
                    className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <CardContent className="p-6 space-y-4">
                      {/* Header with warehouse name and country */}
                      <div className="pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <CountryFlag
                            countryCode={
                              warehouse.country_code?.length === 2
                                ? warehouse.country_code.toUpperCase()
                                : getCountryCode(warehouse.country)
                            }
                            size="md"
                          />
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {warehouse.name || "Unnamed Warehouse"}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Information rows with icons */}
                      <div className="space-y-3">
                        {/* Address Line 1 */}
                        <div className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-3 flex-1">
                            <User2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">Name:</p>
                              <p className="text-sm font-medium text-slate-700">
                                {warehouses?.userFirstName}{" "}
                                {warehouses?.userLastName}{" "}
                                {`${warehouse.country_code}${warehouses?.userWarehouseId}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `${warehouses?.userFirstName} ${warehouses?.userLastName} ${warehouse.country_code}${warehouses?.userWarehouseId}`,
                                `${warehouse.warehouse_id}-name`
                              )
                            }
                            className="transition-opacity p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 flex-shrink-0"
                            title="Copy"
                          >
                            {copiedAddress ===
                            `${warehouse.warehouse_id}-line1` ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-3 flex-1">
                            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">
                                Address Details:
                              </p>
                              <p className="text-sm font-medium text-slate-700">
                                {warehouse.address_line1}, {` `}
                                {/* {`${warehouse.country_code}${warehouses?.userWarehouseId}`} */}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `${warehouse.address_line1}, `,
                                `${warehouse.warehouse_id}-line1`
                              )
                            }
                            className="transition-opacity p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 flex-shrink-0"
                            title="Copy"
                          >
                            {copiedAddress ===
                            `${warehouse.warehouse_id}-line1` ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Address Line 2 */}
                        {warehouse.address_line2 && (
                          <div className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3 flex-1">
                              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-slate-500">
                                  Address Details:
                                </p>
                                <p className="text-sm text-slate-700">
                                  {warehouse.address_line2}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  warehouse.address_line2!,
                                  `${warehouse.warehouse_id}-line2`
                                )
                              }
                              className="transition-opacity p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 flex-shrink-0"
                              title="Copy"
                            >
                              {copiedAddress ===
                              `${warehouse.warehouse_id}-line2` ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* City/State */}
                        <div className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-3 flex-1">
                            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">City:</p>
                              <p className="text-sm font-medium text-slate-700 capitalize">
                                {warehouse.address_line3}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                warehouse.address_line3!,
                                `${warehouse.warehouse_id}-city`
                              )
                            }
                            className="transition-opacity p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 flex-shrink-0"
                            title="Copy"
                          >
                            {copiedAddress ===
                            `${warehouse.warehouse_id}-city` ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Zip Code */}
                        <div className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-3 flex-1">
                            <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">
                                Zip Code:
                              </p>
                              <p className="text-sm font-medium text-slate-700">
                                {warehouse.postal_code}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                warehouse.postal_code || "",
                                `${warehouse.warehouse_id}-postal`
                              )
                            }
                            className="transition-opacity p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 flex-shrink-0"
                            title="Copy"
                          >
                            {copiedAddress ===
                            `${warehouse.warehouse_id}-postal` ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Country */}
                        <div className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-3 flex-1">
                            <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">Country:</p>
                              <p className="text-sm font-medium text-slate-700">
                                {warehouse.country}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                warehouse.country,
                                `${warehouse.warehouse_id}-country`
                              )
                            }
                            className="transition-opacity p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 flex-shrink-0"
                            title="Copy"
                          >
                            {copiedAddress ===
                            `${warehouse.warehouse_id}-country` ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Phone Numbers */}
                        {warehouse.phone && warehouse.phone.length > 0 && (
                          <div className="space-y-2">
                            {warehouse.phone.map((phoneNumber, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between group/item"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs text-slate-500">
                                      {index === 0 ? "Phone:" : ""}
                                    </p>
                                    <p className="text-sm font-medium text-slate-700">
                                      {phoneNumber}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      phoneNumber,
                                      `${warehouse.warehouse_id}-phone-${index}`
                                    )
                                  }
                                  className="transition-opacity p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 flex-shrink-0"
                                  title="Copy"
                                >
                                  {copiedAddress ===
                                  `${warehouse.warehouse_id}-phone-${index}` ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Copy Full Address Button */}
                      <div className="pt-4 border-t border-slate-100">
                        <Button
                          variant="outline"
                          className="w-full border-slate-300 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200 font-medium"
                          onClick={() => {
                            const fullAddress = [
                              `${warehouses?.userFirstName} ${warehouses?.userLastName} ${warehouse.country_code}${warehouses?.userWarehouseId}`,
                              `${warehouse.address_line1},`,
                              warehouse.address_line2,
                              warehouse.address_line3,
                              warehouse.address_line4,
                              `${getCityFromAddress(warehouse)}, ${
                                warehouse.postal_code
                              }`,
                              warehouse.country,
                            ]
                              .filter(Boolean)
                              .join(", ");

                            copyToClipboard(
                              fullAddress,
                              `${warehouse.warehouse_id}-full`
                            );
                          }}
                        >
                          {copiedAddress ===
                          `${warehouse.warehouse_id}-full` ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Address Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Full Address
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredWarehouses.length === 0 && (
              <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 backdrop-blur-sm p-12 text-center">
                <div className="rounded-full bg-slate-100 p-4 mb-4">
                  <MapPin className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No warehouses found
                </h3>
                <p className="text-slate-600 max-w-md">
                  {searchQuery
                    ? `No warehouses match "${searchQuery}". Try adjusting your search terms.`
                    : "There are no warehouses available at the moment. Check back later or contact support."}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
