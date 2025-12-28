"use client";

import { Carousel, TestimonialCard } from "@/components/ui/retro-testimonial";
import { iTestimonial } from "@/components/ui/retro-testimonial";

// Transform existing testimonial data to iTestimonial format
const testimonials: iTestimonial[] = [
  {
    name: "Priya Sharma",
    designation: "Singapore",
    description: "I've been using Buy2send for over a year to get Indian sarees and jewelry. The consolidation service saved me hundreds of dollars! Highly recommend.",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Ahmed Al-Rashid",
    designation: "Saudi Arabia",
    description: "Ordering from UK was always complicated until I found Buy2send. They handle everything—from purchase to customs. Simply brilliant service!",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Chen Wei",
    designation: "China",
    description: "The product link service is genius! I just send them links from Malaysian sites and they ship directly to Beijing. So convenient!",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Sarah Johnson",
    designation: "Australia",
    description: "Dubai shopping was never this easy! Buy2send's quality checks and fast shipping mean I get exactly what I ordered every time.",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Rajesh Kumar",
    designation: "USA",
    description: "As an expat, I miss Indian products. Buy2send brings authentic items from home with proper packaging and care. Worth every penny!",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Emma Wilson",
    designation: "Canada",
    description: "The virtual warehouse in London is perfect for consolidating my UK shopping. Free storage for 45 days gives me time to find more deals!",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
];

// Background image for testimonial cards
const backgroundImage = "https://images.unsplash.com/photo-1528458965990-428de4b1cb0d?q=80&w=3129&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export function TestimonialsSection() {
  // Create testimonial cards
  const cards = testimonials.map((testimonial, index) => (
    <TestimonialCard
      key={testimonial.name}
      testimonial={testimonial}
      index={index}
      backgroundImage={backgroundImage}
    />
  ));

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

        <Carousel items={cards} />
      </div>
    </section>
  );
}