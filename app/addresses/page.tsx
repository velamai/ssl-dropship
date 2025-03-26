"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Copy, CheckCircle2, ChevronLeft, Search } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCountryCode } from "@/lib/utils";
import { CountryFlag } from "@/components/country-flag";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AddressesPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for addresses
  const addresses = [
    {
      id: "addr-1",
      name: "Main Warehouse",
      addressLine1: "123 Logistics Way",
      addressLine2: "Industrial Zone",
      city: "Colombo",
      postalCode: "10300",
      country: "Sri Lanka",
      isDefault: true,
    },
    {
      id: "addr-2",
      name: "Secondary Facility",
      addressLine1: "456 Shipping Avenue",
      addressLine2: "Business Park",
      city: "Kandy",
      postalCode: "20000",
      country: "Sri Lanka",
      isDefault: false,
    },
    {
      id: "addr-3",
      name: "International Hub",
      addressLine1: "789 Export Road",
      addressLine2: "Free Trade Zone",
      city: "Singapore",
      postalCode: "018956",
      country: "Singapore",
      isDefault: false,
    },
    {
      id: "addr-4",
      name: "US Distribution Center",
      addressLine1: "101 Distribution Lane",
      addressLine2: "Commerce Center",
      city: "New York",
      postalCode: "10001",
      country: "United States",
      isDefault: false,
    },
  ];

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(identifier);

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
  };

  // Filter addresses based on search query
  const filteredAddresses = addresses.filter(
    (address) =>
      address.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar activePage="addresses" />

        <main className="flex-1 bg-[#fefcff] px-4 py-8 md:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            {/* Mobile Back Button */}
            <div className="mb-4 block md:hidden">
              <Link href="/dashboard" className="flex items-center text-sm text-[#3f3f3f]">
                <ChevronLeft size={16} className="mr-1" />
                Back to Dashboard
              </Link>
            </div>

            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-[#3f3f3f]">Addresses</h1>
                <p className="text-[#a2a2a2]">View and copy addresses for your shipments</p>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#a2a2a2]" />
                <Input
                  type="search"
                  placeholder="Search addresses..."
                  className="pl-8 border-[#e2e2e2] bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAddresses.map((address) => (
                <Card key={address.id} className="border-[#e2e2e2] bg-white">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CountryFlag countryCode={getCountryCode(address.country)} size="md" />
                        <h3 className="font-medium text-[#3f3f3f]">{address.name}</h3>
                      </div>
                      {address.isDefault && <Badge className="bg-success text-white">Default</Badge>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#3f3f3f]">{address.addressLine1}</p>
                        <button
                          onClick={() => copyToClipboard(address.addressLine1, `${address.id}-line1`)}
                          className="text-[#a2a2a2] hover:text-primary"
                          aria-label="Copy address line 1"
                        >
                          {copiedAddress === `${address.id}-line1` ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#3f3f3f]">{address.addressLine2}</p>
                        <button
                          onClick={() => copyToClipboard(address.addressLine2, `${address.id}-line2`)}
                          className="text-[#a2a2a2] hover:text-primary"
                          aria-label="Copy address line 2"
                        >
                          {copiedAddress === `${address.id}-line2` ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#3f3f3f]">
                          {address.city}, {address.postalCode}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(`${address.city}, ${address.postalCode}`, `${address.id}-city`)
                          }
                          className="text-[#a2a2a2] hover:text-primary"
                          aria-label="Copy city and postal code"
                        >
                          {copiedAddress === `${address.id}-city` ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#3f3f3f]">{address.country}</p>
                        <button
                          onClick={() => copyToClipboard(address.country, `${address.id}-country`)}
                          className="text-[#a2a2a2] hover:text-primary"
                          aria-label="Copy country"
                        >
                          {copiedAddress === `${address.id}-country` ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="mt-4 w-full border-primary text-primary hover:bg-primary hover:text-white"
                      onClick={() =>
                        copyToClipboard(
                          `${address.addressLine1}, ${address.addressLine2}, ${address.city}, ${address.postalCode}, ${address.country}`,
                          `${address.id}-full`
                        )
                      }
                    >
                      {copiedAddress === `${address.id}-full` ? "Address Copied!" : "Copy Full Address"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAddresses.length === 0 && (
              <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-[#e2e2e2] bg-white p-8 text-center">
                <MapPin className="h-12 w-12 text-[#a2a2a2]" />
                <h3 className="mt-4 text-lg font-medium text-[#3f3f3f]">No addresses found</h3>
                <p className="mt-2 text-[#a2a2a2]">
                  {searchQuery
                    ? `No addresses match "${searchQuery}"`
                    : "There are no addresses available at the moment."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
