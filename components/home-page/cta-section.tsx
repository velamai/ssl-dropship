import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Package, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden bg-pink-gradient p-12 lg:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                Join 50,000+ Global Shoppers Today
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white text-balance leading-tight">
              Ready to Shop Without Borders?
            </h2>

            <p className="text-xl text-white/90 max-w-2xl mx-auto text-pretty leading-relaxed">
              Get your personal warehouse address or start using our
              link-to-ship service. No subscription fees. No hidden charges.
              Just simple, transparent global shopping.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg h-14 px-8 hover:scale-105 transition-transform"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/product-price-calculator">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg h-14 px-8 bg-white/10 hover:bg-white/20 text-white border-white hover:scale-105 transition-transform"
                >
                  <Package className="w-5 h-5 mr-2" />
                  View Pricing
                </Button>
              </Link>
            </div>

            <div className="pt-8 text-white/80 text-sm">
              ✓ Free 45-day storage ✓ No setup fees ✓ Cancel anytime
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
