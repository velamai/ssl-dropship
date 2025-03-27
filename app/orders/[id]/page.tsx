"use client";
import Link from "next/link";
import { Package, ChevronLeft, Truck, MapPin, Box, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCountryCode } from "@/lib/utils";
import { CountryFlag } from "@/components/country-flag";

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  // Mock order data based on the ID from the URL
  const order = {
    id: params.id,
    status:
      params.id === "ORD-2023-1234"
        ? "ready"
        : params.id === "ORD-2023-1235"
        ? "processing"
        : params.id === "ORD-2023-1236"
        ? "completed"
        : params.id === "ORD-2023-1237"
        ? "cancelled"
        : "ready",
    date: "2023-11-15",
    items: [
      {
        id: "ITEM-001",
        name: "Premium Wireless Headphones",
        quantity: 1,
        price: 129.99,
        weight: "0.5 kg",
        dimensions: "20 × 15 × 8 cm",
      },
      {
        id: "ITEM-002",
        name: "Smartphone Protective Case",
        quantity: 2,
        price: 24.99,
        weight: "0.1 kg",
        dimensions: "15 × 8 × 1 cm",
      },
    ],
    trackingNumber: "CM" + Math.floor(1000000000 + Math.random() * 9000000000),
    destination: {
      address: "123 Main St, New York, NY 10001",
      country: "United States",
    },
    estimatedDelivery: "2023-11-20",
    shippingMethod: "Express",
    notes: "Please handle with care. Fragile items inside.",
    trackingHistory: [
      {
        status: "Order Placed",
        location: "Online",
        timestamp: "Nov 15, 2023 - 09:23 AM",
        completed: true,
      },
      {
        status: "Processing",
        location: "Colombo Warehouse",
        timestamp: "Nov 15, 2023 - 02:45 PM",
        completed: true,
      },
      {
        status: "Ready for Pickup",
        location: "Colombo Warehouse",
        timestamp: "Nov 16, 2023 - 10:30 AM",
        completed: params.id !== "ORD-2023-1235",
      },
      {
        status: "In Transit",
        location: "International Shipping",
        timestamp: params.id === "ORD-2023-1236" ? "Nov 17, 2023 - 08:15 AM" : "",
        completed: params.id === "ORD-2023-1236",
      },
      {
        status: "Delivered",
        location: "New York, NY",
        timestamp: params.id === "ORD-2023-1236" ? "Nov 19, 2023 - 02:10 PM" : "",
        completed: params.id === "ORD-2023-1236",
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-success text-white";
      case "processing":
        return "bg-primary text-white";
      case "completed":
        return "bg-secondary text-secondary-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (completed: boolean, isActive: boolean) => {
    if (completed) {
      return <CheckCircle2 className="h-6 w-6 text-success" />;
    } else if (isActive) {
      return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
    } else {
      return <Clock className="h-6 w-6 text-[#a2a2a2]" />;
    }
  };

  // Calculate total price
  const totalPrice = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activePage="orders" />

      <main className="flex-1 bg-[#fefcff] px-4 py-8 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/orders" className="flex items-center text-sm text-[#3f3f3f] hover:text-primary">
              <ChevronLeft size={16} className="mr-1" />
              Back to Orders
            </Link>
          </div>

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#3f3f3f]">Order {order.id}</h1>
              <p className="text-[#a2a2a2]">Placed on {order.date}</p>
            </div>

            <Badge className={`${getStatusColor(order.status)} text-base px-3 py-1`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Order Details and Items */}
            <div className="md:col-span-2 space-y-6">
              {/* Order Summary Card */}
              <Card className="border-[#e2e2e2] bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#3f3f3f]">
                    <Package className="h-5 w-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-[#a2a2a2]">Tracking Number</h3>
                      <p className="text-[#3f3f3f]">{order.trackingNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#a2a2a2]">Shipping Method</h3>
                      <p className="text-[#3f3f3f]">{order.shippingMethod}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#a2a2a2]">Estimated Delivery</h3>
                      <p className="text-[#3f3f3f]">{order.estimatedDelivery}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#a2a2a2]">Total Items</h3>
                      <p className="text-[#3f3f3f]">{order.items.length}</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-4 rounded-lg bg-accent p-3">
                      <h3 className="text-sm font-medium text-[#3f3f3f]">Notes</h3>
                      <p className="text-sm text-[#3f3f3f]">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items Card */}
              <Card className="border-[#e2e2e2] bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#3f3f3f]">
                    <Box className="h-5 w-5 text-primary" />
                    Items ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={item.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex flex-col gap-4 md:flex-row md:items-start">
                          <div className="h-16 w-16 rounded-md bg-accent flex items-center justify-center">
                            <Box className="h-8 w-8 text-primary" />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium text-[#3f3f3f]">{item.name}</h3>
                            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4">
                              <div>
                                <p className="text-[#a2a2a2]">Quantity</p>
                                <p className="font-medium text-[#3f3f3f]">{item.quantity}</p>
                              </div>
                              <div>
                                <p className="text-[#a2a2a2]">Price</p>
                                <p className="font-medium text-[#3f3f3f]">${item.price.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[#a2a2a2]">Weight</p>
                                <p className="font-medium text-[#3f3f3f]">{item.weight}</p>
                              </div>
                              <div>
                                <p className="text-[#a2a2a2]">Dimensions</p>
                                <p className="font-medium text-[#3f3f3f]">{item.dimensions}</p>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[#a2a2a2]">Subtotal</p>
                            <p className="font-medium text-[#3f3f3f]">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Separator className="my-4" />

                    <div className="flex justify-between">
                      <p className="font-medium text-[#3f3f3f]">Total</p>
                      <p className="font-bold text-lg text-primary">${totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tracking and Shipping Info */}
            <div className="space-y-6">
              {/* Shipping Address Card */}
              <Card className="border-[#e2e2e2] bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#3f3f3f]">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[#3f3f3f]">{order.destination.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[#3f3f3f]">{order.destination.country}</p>
                    <CountryFlag countryCode={getCountryCode(order.destination.country)} size="sm" />
                  </div>
                </CardContent>
              </Card>

              {/* Tracking History Card */}
              <Card className="border-[#e2e2e2] bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#3f3f3f]">
                    <Truck className="h-5 w-5 text-primary" />
                    Tracking History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {order.trackingHistory.map((event, index) => {
                      // Determine if this is the active (current) step
                      const isActive = event.completed === false;

                      return (
                        <div key={index} className="relative flex gap-4">
                          {/* Status Icon */}
                          <div className="flex-shrink-0">{getStatusIcon(event.completed, isActive)}</div>

                          {/* Vertical Line */}
                          {index < order.trackingHistory.length - 1 && (
                            <div className="absolute left-3 top-6 h-full w-[2px] bg-[#e2e2e2]"></div>
                          )}

                          {/* Status Details */}
                          <div className="flex-1 pb-8">
                            <h3 className={`font-medium ${isActive ? "text-primary" : "text-[#3f3f3f]"}`}>
                              {event.status}
                            </h3>

                            {event.timestamp && <p className="mt-1 text-sm text-[#a2a2a2]">{event.timestamp}</p>}

                            {event.location && <p className="text-sm text-[#a2a2a2]">{event.location}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full" variant="default">
                  <Truck className="mr-2 h-4 w-4" />
                  Track Shipment
                </Button>

                <Button className="w-full" variant="outline">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Report an Issue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
