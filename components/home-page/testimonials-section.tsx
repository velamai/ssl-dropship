import { Card } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Singapore",
    country: "🇸🇬",
    rating: 5,
    text: "I've been using Buy2send for over a year to get Indian sarees and jewelry. The consolidation service saved me hundreds of dollars! Highly recommend.",
  },
  {
    name: "Ahmed Al-Rashid",
    location: "Saudi Arabia",
    country: "🇸🇦",
    rating: 5,
    text: "Ordering from UK was always complicated until I found Buy2send. They handle everything—from purchase to customs. Simply brilliant service!",
  },
  {
    name: "Chen Wei",
    location: "China",
    country: "🇨🇳",
    rating: 5,
    text: "The product link service is genius! I just send them links from Malaysian sites and they ship directly to Beijing. So convenient!",
  },
  {
    name: "Sarah Johnson",
    location: "Australia",
    country: "🇦🇺",
    rating: 5,
    text: "Dubai shopping was never this easy! Buy2send's quality checks and fast shipping mean I get exactly what I ordered every time.",
  },
  {
    name: "Rajesh Kumar",
    location: "USA",
    country: "🇺🇸",
    rating: 5,
    text: "As an expat, I miss Indian products. Buy2send brings authentic items from home with proper packaging and care. Worth every penny!",
  },
  {
    name: "Emma Wilson",
    location: "Canada",
    country: "🇨🇦",
    rating: 5,
    text: "The virtual warehouse in London is perfect for consolidating my UK shopping. Free storage for 45 days gives me time to find more deals!",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-accent/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Trusted by <span className="text-primary animate-gradient">50,000+ Happy Shoppers</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Real stories from customers who shop globally with confidence
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-gradient rounded-full flex items-center justify-center text-2xl">
                  {testimonial.country}
                </div>
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
