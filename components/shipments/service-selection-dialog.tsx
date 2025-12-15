"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2, Warehouse, Zap, Shield, CheckCircle2, ArrowRight, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ServiceSelectionDialogProps {
  children?: React.ReactNode
}

export function ServiceSelectionDialog({ children }: ServiceSelectionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSelectService = (service: "link" | "warehouse") => {
    setOpen(false)
    // Navigate to create-shipments page with the selected service
    router.push(`/create-shipments?service=${service}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Create Orders
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-0">
        <div className="relative bg-gradient-to-br from-primary/5 via-white to-purple-50/30 rounded-lg">
          {/* Header Section */}
          <DialogHeader className="p-8 pb-6 text-center space-y-3">
            <div className="flex justify-center mb-2">
              <Badge variant="secondary" className="text-primary font-semibold px-4 py-1.5 shadow-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Create New Order
              </Badge>
            </div>
            <DialogTitle className="text-3xl md:text-4xl font-bold text-balance tracking-tight">
              Choose Your <span className="text-primary">Shipping Service</span>
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground max-w-xl mx-auto text-balance">
              Select the service that best fits your needs. Both options come with full tracking and support.
            </DialogDescription>
          </DialogHeader>

          {/* Service Cards */}
          <div className="px-6 pb-8 grid md:grid-cols-2 gap-5">
            {/* Link-to-Ship Service Card */}
            <Card className="group relative overflow-hidden border-2 border-primary/20 hover:border-primary shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1 bg-white">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-light/20 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

              <CardContent className="relative p-6 space-y-5">
                {/* Icon & Badge */}
                <div className="flex items-start justify-between">
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Link2 className="h-7 w-7 text-white" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-sm">
                    <Zap className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Link-to-Ship Service</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Share product links and we'll purchase & ship directly to your destination.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Quick & Convenient</p>
                      <p className="text-xs text-muted-foreground">Direct shipping, no warehouse needed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">We Purchase For You</p>
                      <p className="text-xs text-muted-foreground">Just share links, we handle it all</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Global Delivery</p>
                      <p className="text-xs text-muted-foreground">Ship from anywhere to anywhere</p>
                    </div>
                  </div>
                </div>

                {/* Best For Section */}
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Best for:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      Single Items
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      Quick Orders
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      First-time Users
                    </Badge>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectService("link")}
                  size="lg"
                  className="w-full group/button mt-4 shadow-md hover:shadow-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/button:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* Warehouse Service Card */}
            <Card className="group relative overflow-hidden border-2 border-purple-200 hover:border-purple-400 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1 bg-white">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 to-purple-600/20 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

              <CardContent className="relative p-6 space-y-5">
                {/* Icon & Badge */}
                <div className="flex items-start justify-between">
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Warehouse className="h-7 w-7 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shadow-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Secure
                  </Badge>
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Virtual Warehouse Service</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Send items to our warehouse, we'll consolidate and forward to your destination.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Bulk Consolidation</p>
                      <p className="text-xs text-muted-foreground">Combine multiple items into one</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Product Inspection</p>
                      <p className="text-xs text-muted-foreground">We check items before forwarding</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Flexible Shipping</p>
                      <p className="text-xs text-muted-foreground">Choose when to ship your package</p>
                    </div>
                  </div>
                </div>

                {/* Best For Section */}
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Best for:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      Multiple Items
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      Cost Savings
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      Bulk Orders
                    </Badge>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectService("warehouse")}
                  size="lg"
                  variant="outline"
                  className="w-full group/button mt-4 border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-md hover:shadow-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/button:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <div className="text-center px-6 pb-6">
            <p className="text-xs text-muted-foreground">
              Need help choosing?{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                Compare services
              </a>{" "}
              or{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                contact support
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
