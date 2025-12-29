"use client";

import { Carousel, TestimonialCard } from "@/components/ui/retro-testimonial";
import { iTestimonial } from "@/components/ui/retro-testimonial";

// Transform existing testimonial data to iTestimonial format
const testimonials: iTestimonial[] = [
  {
    name: "Priya Sharma",
    designation: "India",
    description: "Got my favorite Indian spices delivered right to my door! Packaging was perfect and everything arrived fresh. Love this service!",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Ravi Patel",
    designation: "India",
    description: "Ordered electronics from Malaysia through Buy2send. Fast shipping and great customer support. Will definitely use again!",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Anjali Reddy",
    designation: "India",
    description: "The warehouse consolidation feature saved me so much on shipping! Combined three orders and got them all together. Amazing!",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Kamal Perera",
    designation: "Sri Lanka",
    description: "Ordered items from UK and everything arrived safely. The tracking updates were really helpful. Very satisfied!",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Nimal Fernando",
    designation: "Sri Lanka",
    description: "Great experience shopping from India. Got my Ayurvedic products without any hassles. Packaging was excellent!",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Siti Aishah",
    designation: "Malaysia",
    description: "Love how easy it is to shop from multiple countries. The product link service is so convenient. Highly recommend!",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Hassan Ibrahim",
    designation: "Malaysia",
    description: "Ordered branded items from Dubai and UK. Everything was genuine and arrived on time. Excellent service!",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "Michael Johnson",
    designation: "USA",
    description: "As someone living in the US, I love being able to shop from India and Sri Lanka. Buy2send makes it so simple!",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format",
  },
  {
    name: "James Thompson",
    designation: "UK",
    description: "Fantastic service! Got items from Malaysia delivered to London quickly. The consolidation feature is brilliant.",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&auto=format",
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
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto text-pretty leading-relaxed">
            Real stories from customers who shop globally with confidence
          </p>
        </div>

        <Carousel items={cards} />
      </div>
    </section>
  );
}