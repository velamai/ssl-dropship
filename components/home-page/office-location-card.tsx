"use client";
import { MapPin, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

interface OfficeLocationCardProps {
  flag: string;
  name: string;
  company: string;
  address: string;
  email: string;
  phones: string[];
}

function OfficeLocationCard({
  flag,
  name,
  company,
  address,
  email,
  phones,
}: OfficeLocationCardProps) {
  useEffect(() => {
    if (
      typeof document !== "undefined" &&
      !document.getElementById("office-card-styles")
    ) {
      const style = document.createElement("style");
      style.id = "office-card-styles";
      style.textContent = `
        .office-name {
          color: oklch(0.62 0.22 345);
        }
        .group:hover .office-name {
          color: oklch(0.72 0.18 350);
        }
        .office-icon {
          color: oklch(0.72 0.18 350);
        }
        .group:hover .office-icon {
          color: oklch(0.62 0.22 345);
        }
        .office-email:hover {
          color: oklch(0.62 0.22 345);
        }
        .office-gradient-overlay {
          background: linear-gradient(to bottom right, oklch(0.62 0.22 345 / 0), transparent, oklch(0.72 0.18 350 / 0));
        }
        .group:hover .office-gradient-overlay {
          background: linear-gradient(to bottom right, oklch(0.62 0.22 345 / 0.05), transparent, oklch(0.72 0.18 350 / 0.05));
        }
        .office-flag-bg {
          background: linear-gradient(to bottom right, rgb(241 245 249), rgb(248 250 252));
        }
        .group:hover .office-flag-bg {
          background: linear-gradient(to bottom right, oklch(0.72 0.18 350 / 0.1), oklch(0.62 0.22 345 / 0.1));
        }
        .office-border {
          border-color: oklch(0.62 0.22 345 / 0);
        }
        .group:hover .office-border {
          border-color: oklch(0.62 0.22 345 / 0.2);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="group relative h-full overflow-hidden rounded-[1.5rem] bg-card backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:bg-card/90">
      <div
        className="absolute inset-0 transition-all duration-500 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom right, oklch(0.55 0.22 25 / 0), transparent, oklch(0.72 0.16 60 / 0))",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(to bottom right, oklch(0.55 0.22 25 / 0.05), transparent, oklch(0.72 0.16 60 / 0.05))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(to bottom right, oklch(0.55 0.22 25 / 0), transparent, oklch(0.72 0.16 60 / 0))";
        }}
      />

      <div
        className="relative h-32 transition-all duration-500 flex items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(to bottom right, rgb(241 245 249), rgb(248 250 252))",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(to bottom right, oklch(0.72 0.16 60 / 0.1), oklch(0.55 0.22 25 / 0.1))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(to bottom right, rgb(241 245 249), rgb(248 250 252))";
        }}
      >
        {/* <div className="text-6xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500"></div> */}
        {flag && (
          <Image
            src={flag}
            alt={name}
            width={100}
            height={100}
            className="size-40 object-contain"
          />
        )}
      </div>

      <div className="relative p-6 space-y-4">
        <div>
          <h3 className="font-bold text-sm mb-1 transition-colors duration-300 office-name">
            {name}
          </h3>
          <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
            {company}
          </p>
        </div>

        <div className="space-y-3 text-xs text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
          <div className="flex gap-3 group-hover:translate-x-1 transition-transform duration-300">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 transition-colors duration-300 office-icon" />
            <span className="leading-tight">{address}</span>
          </div>

          <div className="flex gap-3 group-hover:translate-x-1 transition-transform duration-300">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 transition-colors duration-300 office-icon" />
            <a
              href={`mailto:${email}`}
              className="transition-colors break-all office-email"
            >
              {email}
            </a>
          </div>

          <div className="flex gap-3 group-hover:translate-x-1 transition-transform duration-300">
            <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 transition-colors duration-300 office-icon" />
            <div className="space-y-1">
              {phones.map((phone) => (
                <div key={phone}>{phone}</div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-[1.5rem] border-2 transition-all duration-500 pointer-events-none"
          style={{
            borderColor: "oklch(0.55 0.22 25 / 0)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0)";
          }}
        />
      </div>
    </div>
  );
}

export const OfficeLocation = () => {
  return (
    <div className="py-20 bg-white">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-balance">
          Our Office Locations
        </h2>
        <p className="text-muted-foreground text-pretty">
          Connect with us at any of our worldwide office locations
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
        <OfficeLocationCard
          flag={"/flags/in.png"}
          name="INDIA OFFICE"
          company="VALUABLE SWIFT COURIERS LLP"
          address="GF 4, MANTHRA APARTMENTS, No.112, NORTH BOAG ROAD, T NAGAR, CHENNAI, TAMILNADU - 600017."
          email="info@universalmail.in"
          phones={["(+91) 984 060 1406", "(+91) 984 063 5406"]}
        />
        <OfficeLocationCard
          flag={"/flags/sl.png"}
          name="SRI LANKA OFFICE"
          company="SUPER SAVE LANKA (PVT) LTD."
          address="No.4, COUNCIL AVENUE, (NEAR DEHIWALA MUNICIPAL COUNCIL), DEHIWALA, SRILANKA."
          email="info@colombomail.lk"
          phones={["(+94) 114 896 660", "(+94) 755 192 192"]}
        />
        <OfficeLocationCard
          flag={"/flags/uae.png"}
          name="UAE OFFICE"
          company="SUPER SAVE GENERAL TRADING LLC"
          address="ROOM 201, 22ND FLOOR, 3RD ABUBAKAR BUILDING, 37TH STREET, AL MURAQQABAT, DUBAI, UAE."
          email="uae@colombomail.lk"
          phones={["(+971) 551 536 286"]}
        />
        <OfficeLocationCard
          flag={"/flags/uk.png"}
          name="UK OFFICE"
          company="SUPER SAVE UK (PVT) LTD."
          address="234 NORTHUMBERLAND AVENUE, READING, RG2 7QA, UNITED KINGDOM."
          email="uk@colombomail.lk"
          phones={["(+44) 779 175 3342", "(+44) 118 958 9871"]}
        />
        <OfficeLocationCard
          flag={"/flags/ml.png"}
          name="MALAYSIA OFFICE"
          company="SUPER SAVE MALAYSIA (PVT) LTD."
          address="SOHO-1- FLOOR 11 NUMBER13 (11/13), VISTA ALAM SERVICE APARTMENT, JALAN IKHTISAS, SEKSYEN14, SHAH ALAM."
          email="malaysia@colombomail.lk"
          phones={["(+60) 162 860 465", "(+60) 169 433 125"]}
        />
      </div>
    </div>
  );
};
