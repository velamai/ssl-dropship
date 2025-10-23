"use client"

import Link from "next/link"
import { ArrowLeft, Package, Truck, MapPin, User, Save, Send } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createShipment } from "@/lib/actions"
// Add the import for Switch component
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function NewShipmentPage() {
  // Add client-side JavaScript for toggle functionality
  useEffect(() => {
    const pickupToggle = document.getElementById("pickup-toggle")
    const pickupDetails = document.getElementById("pickup-details")

    if (pickupToggle && pickupDetails) {
      // Initially hide the pickup details
      pickupDetails.style.display = "none"

      // Add event listener to toggle
      pickupToggle.addEventListener("change", function () {
        if (this.checked) {
          pickupDetails.style.display = "block"
        } else {
          pickupDetails.style.display = "none"
        }
      })
    }

    return () => {
      if (pickupToggle) {
        pickupToggle.removeEventListener("change", () => {})
      }
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Package className="h-6 w-6" />
            <h1 className="text-xl font-semibold">New Shipment</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" className="font-medium">
              Shipments
            </Button>
            <Button variant="ghost" size="sm">
              Reports
            </Button>
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="container">
          <div className="mb-6">
            <Link
              href="/shipments"
              className="mb-2 flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Shipments
            </Link>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create New Shipment</h2>
                <p className="text-muted-foreground">Fill out the form below to create a new shipment</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-1">
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                <Button type="submit" form="shipment-form" className="gap-1">
                  <Send className="h-4 w-4" />
                  Create Shipment
                </Button>
              </div>
            </div>
          </div>

          <form id="shipment-form" action={createShipment}>
            <Tabs defaultValue="package" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-4">
                <TabsTrigger value="package">Package Details</TabsTrigger>
                <TabsTrigger value="sender">Sender Information</TabsTrigger>
                <TabsTrigger value="recipient">Recipient Information</TabsTrigger>
                <TabsTrigger value="shipping">Shipping Options</TabsTrigger>
              </TabsList>

              <TabsContent value="package" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Package Information
                    </CardTitle>
                    <CardDescription>Enter details about your package</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Package Type</label>
                      <Select name="packageType" defaultValue="parcel">
                        <SelectTrigger>
                          <SelectValue placeholder="Select package type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="parcel">Parcel</SelectItem>
                          <SelectItem value="fragile">Fragile</SelectItem>
                          <SelectItem value="heavy">Heavy Package</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Weight (kg)</label>
                      <Input name="weight" type="number" placeholder="Enter weight" min="0.1" step="0.1" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dimensions (cm)</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input name="length" type="number" placeholder="Length" min="1" />
                        <Input name="width" type="number" placeholder="Width" min="1" />
                        <Input name="height" type="number" placeholder="Height" min="1" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Declared Value</label>
                      <Input name="declaredValue" type="number" placeholder="Enter value in USD" min="1" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Package Description</label>
                      <Textarea name="description" placeholder="Describe the contents of your package" rows={3} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sender" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Sender Information
                    </CardTitle>
                    <CardDescription>Enter the sender's contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input name="senderName" placeholder="Enter sender's full name" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input name="senderPhone" placeholder="Enter sender's phone number" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input name="senderEmail" type="email" placeholder="Enter sender's email address" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input name="senderStreet" placeholder="Street address" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">City</label>
                      <Input name="senderCity" placeholder="City" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Postal/ZIP Code</label>
                      <Input name="senderZip" placeholder="Postal/ZIP code" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">State/Province</label>
                      <Input name="senderState" placeholder="State/Province" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country</label>
                      <Select name="senderCountry" defaultValue="us">
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recipient" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Recipient Information
                    </CardTitle>
                    <CardDescription>Enter the recipient's contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input name="recipientName" placeholder="Enter recipient's full name" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input name="recipientPhone" placeholder="Enter recipient's phone number" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input name="recipientEmail" type="email" placeholder="Enter recipient's email address" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input name="recipientStreet" placeholder="Street address" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">City</label>
                      <Input name="recipientCity" placeholder="City" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Postal/ZIP Code</label>
                      <Input name="recipientZip" placeholder="Postal/ZIP code" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">State/Province</label>
                      <Input name="recipientState" placeholder="State/Province" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country</label>
                      <Select name="recipientCountry" defaultValue="us">
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shipping" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Shipping Options
                    </CardTitle>
                    <CardDescription>Select your shipping preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service Type</label>
                      <Select name="serviceType" defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="express">Express (1-2 days)</SelectItem>
                          <SelectItem value="priority">Priority (2-3 days)</SelectItem>
                          <SelectItem value="standard">Standard (3-5 days)</SelectItem>
                          <SelectItem value="economy">Economy (5-7 days)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ship Date</label>
                      <Input name="shipDate" type="date" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Insurance</label>
                      <Select name="insurance" defaultValue="basic">
                        <SelectTrigger>
                          <SelectValue placeholder="Select insurance option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Insurance</SelectItem>
                          <SelectItem value="basic">Basic Coverage</SelectItem>
                          <SelectItem value="premium">Premium Coverage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tracking Options</label>
                      <Select name="trackingOption" defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue placeholder="Select tracking option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard Tracking</SelectItem>
                          <SelectItem value="detailed">Detailed Tracking</SelectItem>
                          <SelectItem value="signature">Signature Required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Special Instructions</label>
                      <Textarea name="specialInstructions" placeholder="Any special handling instructions" rows={3} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Pickup Options
                    </CardTitle>
                    <CardDescription>Specify if you want to pick up this shipment</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="pickup-toggle" className="text-base font-medium">
                          Enable Pickup
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Choose this option if you want to pick up the shipment yourself
                        </p>
                      </div>
                      <Switch id="pickup-toggle" name="enablePickup" />
                    </div>

                    <div className="pickup-details" id="pickup-details">
                      <h3 className="mb-4 text-sm font-medium">Pickup Location Details</h3>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pickup Address</label>
                          <Input name="pickupAddress" placeholder="Enter pickup address" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pickup City</label>
                          <Input name="pickupCity" placeholder="Enter city" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Postal/ZIP Code</label>
                          <Input name="pickupZip" placeholder="Enter postal/ZIP code" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pickup Date</label>
                          <Input name="pickupDate" type="date" />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Pickup Instructions</label>
                          <Textarea
                            name="pickupInstructions"
                            placeholder="Any special instructions for pickup"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </main>
    </div>
  )
}

