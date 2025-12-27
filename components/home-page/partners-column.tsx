"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Image from "next/image";
import React from "react";

interface Partner {
  name: string;
  description: string;
  color: string;
  logo: React.ReactNode | string;
}

export const PartnersColumn = (props: {
  className?: string;
  partners: Partner[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 15,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.partners.map(({ name, description, color, logo }, i) => (
                <div
                  key={i}
                  className="group relative p-8 rounded-3xl backdrop-blur-xl bg-white/90  shadow-xl hover:shadow-2xl transition-all duration-300 max-w-xs w-full border border-gray-200/50 "
                  style={{
                    boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {/* Hover gradient effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`}
                  />

                  {/* Partner logo */}
                  <div className="relative mb-6 h-16 flex items-center justify-center">
                    {typeof logo === "string" ? (
                      <Image
                        src={logo}
                        alt={`${name} logo`}
                        width={120}
                        height={64}
                        className={cn(
                          "object-contain",
                          logo.includes("ups") ? "size-20" : ""
                        )}
                      />
                    ) : (
                      logo
                    )}
                  </div>

                  {/* Partner name */}
                  <h3 className="text-xl font-bold text-center mb-3 text-foreground">
                    {name}
                  </h3>

                  {/* Partner description */}
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    {description}
                  </p>

                  {/* Corner accent blob */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-brand-orange/10 to-brand-red/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
