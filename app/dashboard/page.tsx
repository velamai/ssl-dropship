"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Mock data for recent orders
  const recentOrders = [
    {
      id: "ORD-2023-1234",
      status: "ready",
      date: "2023-11-15",
      items: 3,
      trackingNumber: "CM1234567890",
    },
    {
      id: "ORD-2023-1235",
      status: "processing",
      date: "2023-11-14",
      items: 1,
      trackingNumber: "CM9876543210",
    },
    {
      id: "ORD-2023-1236",
      status: "completed",
      date: "2023-11-10",
      items: 2,
      trackingNumber: "CM5678901234",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-success text-white";
      case "processing":
        return "bg-primary text-white";
      case "completed":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar activePage="dashboard" />

        <main className="flex-1 bg-[#fefcff] px-4 py-8 md:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#3f3f3f]">Welcome to Drop & Ship</h1>
              <p className="text-[#a2a2a2]">Manage your addresses and orders in one place</p>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              {/* Recent Orders Card */}
              <Card className="border-[#e2e2e2] bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg text-[#3f3f3f]">Recent Orders</CardTitle>
                    </div>
                    <Link href="/orders" className="text-sm text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  <CardDescription className="text-[#a2a2a2]">Your latest shipment orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-[#e2e2e2] p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-[#3f3f3f]">{order.id}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-[#a2a2a2]">Date</p>
                            <p className="font-medium text-[#3f3f3f]">{order.date}</p>
                          </div>
                          <div>
                            <p className="text-[#a2a2a2]">Items</p>
                            <p className="font-medium text-[#3f3f3f]">{order.items}</p>
                          </div>
                        </div>

                        <div className="mt-2">
                          <p className="text-[#a2a2a2]">Tracking #</p>
                          <p className="font-medium text-[#3f3f3f]">{order.trackingNumber}</p>
                        </div>

                        <Link href={`/orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            className="mt-2 w-full justify-between text-primary hover:bg-primary/10"
                          >
                            View Details
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
