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
    question: "How does the warehouse address service work?",
    answer:
      "When you sign up, you'll receive a unique warehouse address in your chosen country (India, Sri Lanka, UAE, Malaysia, or UK). Simply use this address as your shipping address when shopping from online stores in that country. Once your packages arrive at our warehouse, we'll notify you and prepare them for international shipping to your final destination. This service is perfect for consolidating multiple purchases and accessing products that don't ship internationally.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 2,
    question: "How does the product link service work?",
    answer:
      "Our product link service makes shopping effortless! Just paste the product URL from any online store (Amazon, eBay, AliExpress, etc.) into our pricing calculator. We'll purchase the item on your behalf, receive it at our warehouse, perform quality checks, and ship it directly to your address anywhere in the world. You'll see the total cost upfront—including product price, handling fees, and international shipping—with no hidden charges.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 3,
    question: "Can I consolidate multiple packages?",
    answer:
      "Yes! Package consolidation is one of our most popular features. When you have multiple items arriving at our warehouse, we can combine them into a single shipment, which significantly reduces your shipping costs. Simply wait for all your packages to arrive, then request consolidation through your account dashboard. We'll carefully pack everything together and ship it as one package to your destination.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 4,
    question: "How long can packages be stored at your warehouse?",
    answer:
      "We offer free storage for up to 45 days at all our warehouse locations. This gives you plenty of time to receive multiple packages from different sellers and consolidate them into a single shipment. After 45 days, a small storage fee may apply. You'll receive notifications as your storage period approaches, so you can decide when to ship your items.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 5,
    question: "What countries do you have warehouses in?",
    answer:
      "We currently operate warehouses in 5 strategic locations: India (Chennai), Sri Lanka (Dehiwala), UAE (Dubai), Malaysia (Shah Alam), and United Kingdom (Reading). Each warehouse is fully equipped with secure storage, 24/7 surveillance, and climate control. Our expert team at each location handles receiving, quality checks, and packaging to ensure your items are safe and ready for international shipping.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 6,
    question: "Do you perform quality checks on products?",
    answer:
      "Absolutely! Quality assurance is a core part of our service. When we receive products at our warehouse, our trained staff inspects each item for damage, verifies it matches the order description, and checks for any defects. If we notice any issues, we'll immediately notify you with photos and options to proceed. This ensures you receive exactly what you ordered, every time.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 7,
    question: "How do I calculate the total cost including shipping?",
    answer:
      "Use our easy-to-use pricing calculator! Simply paste the product link or enter the product details (price, weight, dimensions), select the origin country and your destination, and choose your preferred shipping method. Our calculator instantly shows you the complete breakdown: product cost, handling fees, international shipping charges, and any applicable customs duties. You'll see the total cost upfront with full transparency—no surprises.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 8,
    question: "What payment methods do you accept?",
    answer:
      "We accept multiple secure payment methods including credit cards, debit cards, and digital payment platforms. All payments are processed securely through our encrypted payment gateway. You can pay for the product cost and shipping fees together, or separately if you prefer. We also support partial payments for larger orders. All transactions are protected and secure.",
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
            Everything you need to know about shopping globally with Buy2send
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
