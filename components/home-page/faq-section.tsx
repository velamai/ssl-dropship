"use client"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FAQItem {
  id: number
  question: string
  answer: string
  image: string
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "How do I calculate shipping costs?",
    answer:
      "Simply use our rate calculator in the hero section. Enter your package weight, dimensions (L×B×H), select whether you're importing or exporting, and choose your origin and destination countries. Our system will instantly provide you with competitive shipping rates from multiple carriers.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 2,
    question: "What countries do you ship to and from?",
    answer:
      "We provide comprehensive international shipping services from India to over 220 countries worldwide. Our extensive network includes all major markets in North America, Europe, Asia, Australia, and emerging markets. We specialize in exports from India and imports to India with streamlined customs clearance.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 3,
    question: "How long does international shipping take?",
    answer:
      "Delivery times vary based on the service selected and destination. Express Air typically takes 2-5 business days, Standard Air takes 5-10 business days, and Economy Sea Freight takes 20-45 days. All shipments include real-time tracking so you can monitor your package throughout its journey.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 4,
    question: "Do you handle customs clearance?",
    answer:
      "Yes! We provide complete customs clearance support for both imports and exports. Our experienced team handles all documentation, duty calculations, and compliance requirements. We're familiar with Indian customs regulations and international trade laws to ensure smooth clearance at all borders.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 5,
    question: "Can you pick up packages from my location?",
    answer:
      "We offer free doorstep pickup services across major Indian cities and towns. Simply schedule a pickup through our platform, and our logistics partner will collect your package at your convenience. We also provide packaging materials and guidance to ensure safe transit.",
    image: "/placeholder.svg?height=400&width=600",
  },
]

export function FAQSection() {
  const [activeTabId, setActiveTabId] = useState<number | null>(1)
  const [activeImage, setActiveImage] = useState(faqData[0].image)

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about international shipping from India
          </p>
        </div>

        <div className="flex w-full items-start justify-between gap-12">
          <div className="w-full md:w-1/2">
            <Accordion type="single" className="w-full" defaultValue="item-1">
              {faqData.map((faq) => (
                <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                  <AccordionTrigger
                    onClick={() => {
                      setActiveImage(faq.image)
                      setActiveTabId(faq.id)
                    }}
                    className="cursor-pointer py-5 !no-underline transition text-left"
                  >
                    <h6
                      className={`text-lg md:text-xl font-semibold ${
                        faq.id === activeTabId ? "text-red-600" : "text-gray-700"
                      }`}
                    >
                      {faq.question}
                    </h6>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mt-3 text-gray-600 leading-relaxed">{faq.answer}</p>
                    <div className="mt-4 md:hidden">
                      <img
                        src={faq.image || "/placeholder.svg"}
                        alt={faq.question}
                        className="h-full max-h-80 w-full rounded-md object-cover"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="relative m-auto hidden w-1/2 overflow-hidden rounded-xl bg-gray-100 md:block">
            <img
              src={activeImage || "/placeholder.svg"}
              alt="FAQ illustration"
              className="aspect-[4/3] rounded-md object-cover transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
