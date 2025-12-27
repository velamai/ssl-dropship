// "use client";

// import { useState, useEffect } from "react";
// import {
//   ArrowRight,
//   Globe,
//   Package,
//   Zap,
//   TrendingUp,
//   Clock,
//   Shield,
//   Star,
//   ChevronDown,
//   Mail,
//   Phone,
//   MapPin,
//   Send,
// } from "lucide-react";
// import Link from "next/link";
// import Footer from "@/components/footer";
// import Image from "next/image";

// export default function Home() {
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [openFaq, setOpenFaq] = useState<number | null>(null);

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 50);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   return (
//     <main className="min-h-screen bg-[#f8f8f8] overflow-hidden">
//       {/* Navigation */}
//       <nav
//         className={`fixed top-0 w-full z-50 transition-all duration-300 ${
//           isScrolled
//             ? "bg-[#f8f8f8]/95 backdrop-blur-md shadow-lg"
//             : "bg-transparent"
//         }`}
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             {/* <div className="w-10 h-10 rounded-lg gradient-purple flex items-center justify-center">
//               <span className="text-white font-bold text-lg">B2S</span>
//             </div> */}
//             <Link href="/">
//               <Image src="logo.png" width={75} height={75} alt="logo" />
//             </Link>

//             {/* <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
//               buy2send
//             </span> */}
//           </div>

//           <div className="flex items-center gap-4">
//             <Link
//               href="/login"
//               className="px-6 py-2 rounded-full text-purple-700 font-semibold hover:bg-purple-50 transition-all duration-300"
//             >
//               Login
//             </Link>
//             <Link
//               href="/register"
//               className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
//             >
//               Register
//             </Link>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
//           <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
//         </div>

//         <div className="relative max-w-7xl mx-auto">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
//             {/* Left Content */}
//             <div className="animate-slide-up">
//               <div className="inline-block mb-6 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
//                 ✨ Global Drop & Ship Solution
//               </div>
//               <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
//                 <span className="text-foreground">Shop Globally,</span>
//                 <br />
//                 <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
//                   Ship Anywhere
//                 </span>
//               </h1>
//               <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
//                 Access global warehouses or shop any product worldwide. We
//                 handle the rest—buying, customs, and delivery to your doorstep.
//               </p>

//               <div className="flex flex-col sm:flex-row gap-4 mb-12">
//                 <Link
//                   href="/register"
//                   className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
//                 >
//                   <span>Get Started</span>
//                   <ArrowRight size={20} />
//                 </Link>
//                 <Link
//                   href="/login"
//                   className="px-8 py-4 rounded-full border-2 border-purple-200 text-purple-700 font-semibold hover:bg-purple-50 transition-all duration-300"
//                 >
//                   How It Works
//                 </Link>
//               </div>

//               {/* Stats */}
//               <div className="grid grid-cols-3 gap-6">
//                 <div
//                   className="animate-fade-in"
//                   style={{ animationDelay: "0.2s" }}
//                 >
//                   <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
//                     150+
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     Global Warehouses
//                   </p>
//                 </div>
//                 <div
//                   className="animate-fade-in"
//                   style={{ animationDelay: "0.4s" }}
//                 >
//                   <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
//                     50%
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     Shipping Savings
//                   </p>
//                 </div>
//                 <div
//                   className="animate-fade-in"
//                   style={{ animationDelay: "0.6s" }}
//                 >
//                   <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
//                     24/7
//                   </div>
//                   <p className="text-sm text-muted-foreground">Support</p>
//                 </div>
//               </div>
//             </div>

//             {/* Right Visual */}
//             <div className="relative h-96 lg:h-full flex items-center justify-center">
//               <div className="relative w-full h-full flex items-center justify-center">
//                 {/* Floating Cards */}
//                 <div className="absolute top-0 right-0 w-64 h-40 bg-white rounded-2xl shadow-2xl p-6 animate-float border border-purple-100">
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="w-12 h-12 rounded-lg gradient-purple flex items-center justify-center">
//                       <Globe size={24} className="text-white" />
//                     </div>
//                     <span className="font-semibold text-foreground">
//                       Global Warehouses
//                     </span>
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     Access warehouses in 50+ countries
//                   </p>
//                 </div>

//                 <div className="absolute bottom-0 left-0 w-64 h-40 bg-white rounded-2xl shadow-2xl p-6 animate-float-delayed border border-purple-100">
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
//                       <Package size={24} className="text-white" />
//                     </div>
//                     <span className="font-semibold text-foreground">
//                       Package Status
//                     </span>
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     Real-time tracking & updates
//                   </p>
//                 </div>

//                 {/* Center Gradient Circle */}
//                 <div className="absolute w-80 h-80 gradient-purple rounded-full opacity-10 blur-3xl"></div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Services Section */}
//       <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl sm:text-5xl font-bold mb-4">
//               Two Powerful Services
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               Choose the service that fits your shopping needs
//             </p>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             {/* Warehouse Service */}
//             <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 hover:border-purple-300 overflow-hidden flex flex-col">
//               <div className="absolute inset-0 gradient-purple opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//               <div className="relative flex flex-col flex-1">
//                 <div className="w-16 h-16 rounded-xl gradient-purple flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
//                   <Globe size={32} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold mb-3 text-foreground">
//                   Warehouse Service
//                 </h3>
//                 <p className="text-muted-foreground mb-6 leading-relaxed">
//                   Get exclusive warehouse addresses in 50+ countries. Shop from
//                   international e-commerce sites using our addresses, and we'll
//                   forward packages to your doorstep.
//                 </p>

//                 <div className="space-y-3 mb-8 flex-1">
//                   <div className="flex items-start gap-3">
//                     <Zap
//                       size={20}
//                       className="text-purple-600 flex-shrink-0 mt-1"
//                     />
//                     <span className="text-foreground">
//                       Instant warehouse access
//                     </span>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <TrendingUp
//                       size={20}
//                       className="text-purple-600 flex-shrink-0 mt-1"
//                     />
//                     <span className="text-foreground">
//                       Consolidated shipping
//                     </span>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <Shield
//                       size={20}
//                       className="text-purple-600 flex-shrink-0 mt-1"
//                     />
//                     <span className="text-foreground">
//                       Full insurance coverage
//                     </span>
//                   </div>
//                 </div>

//                 <Link
//                   href="/login"
//                   className="w-fit px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
//                 >
//                   Start Shopping
//                 </Link>
//               </div>
//             </div>

//             <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 hover:border-purple-300 overflow-hidden flex flex-col">
//               <div className="absolute inset-0 gradient-purple opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//               <div className="relative flex flex-col flex-1">
//                 <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
//                   <Package size={32} className="text-white" />
//                 </div>
//                 <h3 className="text-2xl font-bold mb-3 text-foreground">
//                   Product URL Service
//                 </h3>
//                 <p className="text-muted-foreground mb-6 leading-relaxed">
//                   Found a product you love on a foreign website? Share the link
//                   with us. We'll purchase it, handle all customs, and deliver it
//                   to your address.
//                 </p>

//                 <div className="space-y-3 mb-8 flex-1">
//                   <div className="flex items-start gap-3">
//                     <Zap
//                       size={20}
//                       className="text-purple-600 flex-shrink-0 mt-1"
//                     />
//                     <span className="text-foreground">
//                       Hassle-free purchasing
//                     </span>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <Clock
//                       size={20}
//                       className="text-purple-600 flex-shrink-0 mt-1"
//                     />
//                     <span className="text-foreground">
//                       Fast processing & delivery
//                     </span>
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <Shield
//                       size={20}
//                       className="text-purple-600 flex-shrink-0 mt-1"
//                     />
//                     <span className="text-foreground">Customs handled</span>
//                   </div>
//                 </div>

//                 <Link
//                   href="/product-price-calculator"
//                   className="w-fit px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
//                 >
//                   Calculate Shipping Price
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* How It Works Section */}
//       <section className="py-20 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl sm:text-5xl font-bold mb-4">
//               How It Works
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               Simple steps to get your global shopping delivered
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//             {[
//               {
//                 step: "1",
//                 title: "Sign Up",
//                 desc: "Create your account in seconds",
//               },
//               {
//                 step: "2",
//                 title: "Choose Service",
//                 desc: "Pick warehouse or product URL",
//               },
//               {
//                 step: "3",
//                 title: "Shop & Submit",
//                 desc: "Place order or share product link",
//               },
//               {
//                 step: "4",
//                 title: "Receive",
//                 desc: "Get your package delivered",
//               },
//             ].map((item, idx) => (
//               <div
//                 key={idx}
//                 className="relative animate-fade-in"
//                 style={{ animationDelay: `${idx * 0.1}s` }}
//               >
//                 <div className="bg-white rounded-xl p-6 border border-purple-100 text-center hover:shadow-lg transition-all duration-300">
//                   <div className="w-12 h-12 rounded-full gradient-purple flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
//                     {item.step}
//                   </div>
//                   <h3 className="font-bold text-lg mb-2 text-foreground">
//                     {item.title}
//                   </h3>
//                   <p className="text-sm text-muted-foreground">{item.desc}</p>
//                 </div>
//                 {idx < 3 && (
//                   <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-1 bg-gradient-to-r from-purple-600 to-transparent"></div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl sm:text-5xl font-bold mb-4">
//               Loved by Customers
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               See what our satisfied customers have to say
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               {
//                 name: "Sarah Ahmed",
//                 role: "Fashion Enthusiast",
//                 text: "buy2send made it so easy to shop from my favorite international brands. The warehouse service is a game-changer!",
//                 rating: 5,
//               },
//               {
//                 name: "Marcus Chen",
//                 role: "Tech Buyer",
//                 text: "I found a gadget I wanted on a US site, shared the link, and it arrived at my door in 2 weeks. Incredible service!",
//                 rating: 5,
//               },
//               {
//                 name: "Priya Patel",
//                 role: "Online Shopper",
//                 text: "The customer support is amazing. They helped me track my package and answered all my questions. Highly recommended!",
//                 rating: 5,
//               },
//             ].map((testimonial, idx) => (
//               <div
//                 key={idx}
//                 className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 animate-fade-in"
//                 style={{ animationDelay: `${idx * 0.1}s` }}
//               >
//                 <div className="flex gap-1 mb-4">
//                   {[...Array(testimonial.rating)].map((_, i) => (
//                     <Star
//                       key={i}
//                       size={18}
//                       className="fill-purple-600 text-purple-600"
//                     />
//                   ))}
//                 </div>
//                 <p className="text-foreground mb-6 leading-relaxed">
//                   "{testimonial.text}"
//                 </p>
//                 <div>
//                   <p className="font-bold text-foreground">
//                     {testimonial.name}
//                   </p>
//                   <p className="text-sm text-muted-foreground">
//                     {testimonial.role}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className="py-20 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl sm:text-5xl font-bold mb-4">
//               Why Choose buy2send?
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               Industry-leading features designed for your convenience
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {[
//               {
//                 icon: Globe,
//                 title: "Global Coverage",
//                 desc: "Access warehouses in 150+ countries worldwide",
//               },
//               {
//                 icon: Shield,
//                 title: "Secure & Safe",
//                 desc: "Full insurance coverage on all shipments",
//               },
//               {
//                 icon: Zap,
//                 title: "Lightning Fast",
//                 desc: "Quick processing and delivery times",
//               },
//               {
//                 icon: TrendingUp,
//                 title: "Best Rates",
//                 desc: "Save up to 50% on international shipping",
//               },
//               {
//                 icon: Clock,
//                 title: "24/7 Support",
//                 desc: "Round-the-clock customer assistance",
//               },
//               {
//                 icon: Package,
//                 title: "Real-time Tracking",
//                 desc: "Track your packages every step of the way",
//               },
//             ].map((feature, idx) => {
//               const Icon = feature.icon;
//               return (
//                 <div
//                   key={idx}
//                   className="group bg-white rounded-xl p-8 border border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all duration-300 animate-fade-in"
//                   style={{ animationDelay: `${idx * 0.05}s` }}
//                 >
//                   <div className="w-14 h-14 rounded-lg gradient-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                     <Icon size={28} className="text-white" />
//                   </div>
//                   <h3 className="text-lg font-bold mb-2 text-foreground">
//                     {feature.title}
//                   </h3>
//                   <p className="text-muted-foreground text-sm">
//                     {feature.desc}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent">
//         <div className="max-w-3xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl sm:text-5xl font-bold mb-4">
//               Frequently Asked Questions
//             </h2>
//             <p className="text-lg text-muted-foreground">
//               Find answers to common questions about our services
//             </p>
//           </div>

//           <div className="space-y-4">
//             {[
//               {
//                 q: "How long does delivery take?",
//                 a: "Delivery times vary by destination, typically 7-21 business days. Express options are available for faster delivery.",
//               },
//               {
//                 q: "What payment methods do you accept?",
//                 a: "We accept all major credit cards, debit cards, digital wallets, and bank transfers for your convenience.",
//               },
//               {
//                 q: "Is there a minimum order value?",
//                 a: "No minimum order value required! You can shop for any amount and we'll handle the rest.",
//               },
//               {
//                 q: "What if my package gets damaged?",
//                 a: "All packages are fully insured. In case of damage, we'll file a claim and send a replacement immediately.",
//               },
//               {
//                 q: "Can I track my package in real-time?",
//                 a: "Yes! You'll receive real-time tracking updates via email and SMS throughout your package's journey.",
//               },
//               {
//                 q: "Do you handle customs clearance?",
//                 a: "We handle all customs documentation and clearance, so you don't have to worry about it.",
//               },
//             ].map((faq, idx) => (
//               <div
//                 key={idx}
//                 className="bg-white rounded-lg border border-purple-100 overflow-hidden hover:border-purple-300 transition-all duration-300 animate-fade-in"
//                 style={{ animationDelay: `${idx * 0.05}s` }}
//               >
//                 <button
//                   onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
//                   className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-50 transition-colors duration-300"
//                 >
//                   <span className="font-semibold text-foreground text-left">
//                     {faq.q}
//                   </span>
//                   <ChevronDown
//                     size={20}
//                     className={`text-purple-600 flex-shrink-0 transition-transform duration-300 ${
//                       openFaq === idx ? "rotate-180" : ""
//                     }`}
//                   />
//                 </button>
//                 {openFaq === idx && (
//                   <div className="px-6 py-4 bg-purple-50 border-t border-purple-100 text-muted-foreground animate-slide-up">
//                     {faq.a}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className="py-20 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl sm:text-5xl font-bold mb-4">
//               Get in Touch
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               Have questions? We're here to help. Contact us anytime.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
//             {/* Contact Info Cards */}
//             <div className="bg-white rounded-2xl p-8 border border-purple-100 hover:shadow-lg transition-all duration-300 text-center">
//               <div className="w-16 h-16 rounded-full gradient-purple flex items-center justify-center mx-auto mb-4">
//                 <Mail size={28} className="text-white" />
//               </div>
//               <h3 className="text-xl font-bold mb-2 text-foreground">Email</h3>
//               <p className="text-muted-foreground mb-4">
//                 administrator@universalmail.in
//               </p>
//               <p className="text-sm text-muted-foreground">
//                 We respond within 24 hours
//               </p>
//             </div>

//             <div className="bg-white rounded-2xl p-8 border border-purple-100 hover:shadow-lg transition-all duration-300 text-center">
//               <div className="w-16 h-16 rounded-full gradient-purple flex items-center justify-center mx-auto mb-4">
//                 <Phone size={28} className="text-white" />
//               </div>
//               <h3 className="text-xl font-bold mb-2 text-foreground">Phone</h3>
//               <p className="text-muted-foreground mb-4">+91 63747 93991</p>
//               <p className="text-sm text-muted-foreground">Available 24/7</p>
//             </div>

//             <div className="bg-white rounded-2xl p-8 border border-purple-100 hover:shadow-lg transition-all duration-300 text-center">
//               <div className="w-16 h-16 rounded-full gradient-purple flex items-center justify-center mx-auto mb-4">
//                 <MapPin size={28} className="text-white" />
//               </div>
//               <div className="">
//                 <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">
//                   Address
//                 </h3>
//                 <p className="text-sm text-muted-foreground leading-relaxed">
//                   GF-4, C Block, Manthra Apartments, <br />
//                   North Boag Road, Chennai - 600017
//                   <br />
//                   <span className="text-muted-foreground/80">
//                     Landmark:
//                   </span>{" "}
//                   Near Residential Towers
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Contact Form */}
//           <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-purple-100 shadow-lg">
//             <form className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <input
//                   type="text"
//                   placeholder="Your Name"
//                   className="px-4 py-3 rounded-lg border border-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all duration-300"
//                 />
//                 <input
//                   type="email"
//                   placeholder="Your Email"
//                   className="px-4 py-3 rounded-lg border border-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all duration-300"
//                 />
//               </div>
//               <input
//                 type="text"
//                 placeholder="Subject"
//                 className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all duration-300"
//               />
//               <textarea
//                 placeholder="Your Message"
//                 rows={5}
//                 className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all duration-300 resize-none"
//               ></textarea>
//               <button
//                 type="submit"
//                 className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
//               >
//                 <Send size={20} />
//                 Send Message
//               </button>
//             </form>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-4xl mx-auto">
//           <div className="relative rounded-3xl overflow-hidden">
//             <div className="absolute inset-0 gradient-purple opacity-90"></div>
//             <div className="relative px-8 py-16 sm:px-12 sm:py-20 text-center text-white">
//               <h2 className="text-4xl sm:text-5xl font-bold mb-6">
//                 Ready to Shop Globally?
//               </h2>
//               <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
//                 Join thousands of customers already enjoying global shopping
//                 with buy2send
//               </p>
//               <Link
//                 href="/register"
//                 className="px-8 py-4 rounded-full bg-white text-purple-700 font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
//               >
//                 <span>Get Started Now</span>
//                 <ArrowRight size={20} />
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       <Footer />
//     </main>
//   );
// }

import { Navbar } from "@/components/home-page/navbar";
import { HeroSection } from "@/components/home-page/hero-section";
import { ServicesSection } from "@/components/home-page/services-section";
import { CountriesSection } from "@/components/home-page/countries-section";
import { HowItWorksSection } from "@/components/home-page/how-it-works-section";
import { WarehousesSection } from "@/components/home-page/warehouses-section";
import { TestimonialsSection } from "@/components/home-page/testimonials-section";
import { CTASection } from "@/components/home-page/cta-section";
import { Footer } from "@/components/home-page/footer";
import { Partners } from "@/components/home-page/partners";
import { ServicesCards } from "@/components/home-page/services-cards";
import Image from "next/image";
import { FAQSection } from "@/components/home-page/faq-section";
import { OfficeLocation } from "@/components/home-page/office-location-card";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 w-full h-screen" style={{ zIndex: 0 }}>
        <Image
          src="/hero-bg.png"
          alt="Air cargo logistics with planes and packages in clouds"
          fill
          className="object-cover"
          priority
          quality={100}
          style={{ objectPosition: "center 20%" }}
        />
      </div>

      <main className="overflow-x-hidden">
        <div className="relative z-10 bg-background">
          <Navbar />
          <HeroSection />
          <HowItWorksSection />
          <ServicesSection />
          <Partners />
          <CountriesSection />
        </div>
        <ServicesCards />
        <div className="relative z-10 bg-background">
          <WarehousesSection />
          <TestimonialsSection />
          <CTASection />
          <OfficeLocation />
          <FAQSection />

          <Footer />
        </div>
      </main>
    </div>
  );
}
