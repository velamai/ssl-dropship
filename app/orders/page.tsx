"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ChevronLeft, Search, Filter, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data for orders
  const orders = [
    {
      id: "ORD-2023-1234",
      status: "ready",
      date: "2023-11-15",
      items: 3,
      trackingNumber: "CM1234567890",
      destination: "New York, NY",
      estimatedDelivery: "2023-11-20",
    },
    {
      id: "ORD-2023-1235",
      status: "processing",
      date: "2023-11-14",
      items: 1,
      trackingNumber: "CM9876543210",
      destination: "Los Angeles, CA",
      estimatedDelivery: "2023-11-22",
    },
    {
      id: "ORD-2023-1236",
      status: "completed",
      date: "2023-11-10",
      items: 2,
      trackingNumber: "CM5678901234",
      destination: "Miami, FL",
      estimatedDelivery: "2023-11-15",
    },
    {
      id: "ORD-2023-1237",
      status: "cancelled",
      date: "2023-11-08",
      items: 4,
      trackingNumber: "CM2468013579",
      destination: "Seattle, WA",
      estimatedDelivery: "2023-11-14",
    },
    {
      id: "ORD-2023-1238",
      status: "ready",
      date: "2023-11-12",
      items: 2,
      trackingNumber: "CM1357924680",
      destination: "Denver, CO",
      estimatedDelivery: "2023-11-18",
    },
  ];

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

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.destination.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar activePage="orders" />

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
                <h1 className="text-2xl font-bold text-[#3f3f3f]">My Orders</h1>
                <p className="text-[#a2a2a2]">View and track your shipment orders</p>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6 border-[#e2e2e2] bg-white">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#a2a2a2]" />
                    <Input
                      type="search"
                      placeholder="Search orders..."
                      className="pl-8 border-[#e2e2e2] bg-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#a2a2a2]" />
                    <span className="text-sm text-[#3f3f3f]">Filter by:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px] border-[#e2e2e2] bg-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="border-[#e2e2e2] bg-white">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[#3f3f3f]">{order.id}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-[#a2a2a2]">
                            Tracking: <span className="font-medium text-[#3f3f3f]">{order.trackingNumber}</span>
                          </p>

                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4">
                            <div>
                              <p className="text-[#a2a2a2]">Date</p>
                              <p className="font-medium text-[#3f3f3f]">{order.date}</p>
                            </div>
                            <div>
                              <p className="text-[#a2a2a2]">Items</p>
                              <p className="font-medium text-[#3f3f3f]">{order.items}</p>
                            </div>
                            <div className="col-span-2 mt-2 md:col-span-1 md:mt-0">
                              <p className="text-[#a2a2a2]">Destination</p>
                              <p className="font-medium text-[#3f3f3f]">{order.destination}</p>
                            </div>
                            <div className="col-span-2 mt-2 md:col-span-1 md:mt-0">
                              <p className="text-[#a2a2a2]">Est. Delivery</p>
                              <p className="font-medium text-[#3f3f3f]">{order.estimatedDelivery}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-auto mt-2 md:mt-0">
                        <Link href={`/orders/${order.id}`}>
                          <Button
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary hover:text-white"
                          >
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-[#e2e2e2] bg-white p-8 text-center">
                <Package className="h-12 w-12 text-[#a2a2a2]" />
                <h3 className="mt-4 text-lg font-medium text-[#3f3f3f]">No orders found</h3>
                <p className="mt-2 text-[#a2a2a2]">
                  {searchQuery || statusFilter !== "all"
                    ? "No orders match your current filters. Try adjusting your search criteria."
                    : "You don't have any orders yet."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
