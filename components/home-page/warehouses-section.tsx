import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Shield, Users } from "lucide-react";
import Image from "next/image";

const warehouses = [
  {
    country: "India",
    city: "Chennai",
    flag: "🇮🇳",
    address: "GF 4, MANTHRA APARTMENTS, No.112, NORTH BOAG ROAD, T NAGAR, CHENNAI, TAMILNADU - 600017",
    hours: "9:00 AM - 7:00 PM IST",
    image: "/warehouse images/Warehouse-India.png",
  },
  {
    country: "Sri Lanka",
    city: "Dehiwala",
    flag: "🇱🇰",
    address: "No.4, COUNCIL AVENUE, (NEAR DEHIWALA MUNICIPAL COUNCIL), DEHIWALA, SRILANKA",
    hours: "9:00 AM - 6:00 PM SLST",
    image: "/warehouse images/Warehouse-Sri Lanka.png",
  },
  {
    country: "UAE",
    city: "Dubai",
    flag: "🇦🇪",
    address: "ROOM 201, 22ND FLOOR, 3RD ABUBAKAR BUILDING, 37TH STREET, AL MURAQQABAT, DUBAI, UAE",
    hours: "8:00 AM - 6:00 PM GST",
    image: "/warehouse images/Warehouse-Dubai.png",
  },
  {
    country: "Malaysia",
    city: "Shah Alam",
    flag: "🇲🇾",
    address: "SOHO-1- FLOOR 11 NUMBER13 (11/13), VISTA ALAM SERVICE APARTMENT, JALAN IKHTISAS, SEKSYEN14, SHAH ALAM",
    hours: "9:00 AM - 6:00 PM MYT",
    image: "/warehouse images/Warehouse-Malaysia.png",
  },
  {
    country: "United Kingdom",
    city: "Reading",
    flag: "🇬🇧",
    address: "234 NORTHUMBERLAND AVENUE, READING, RG2 7QA, UNITED KINGDOM",
    hours: "8:00 AM - 6:00 PM GMT",
    image: "/warehouse images/Warehouse-UK.png",
  },
];

// Helper function to generate button text based on country
const getButtonText = (country: string): string => {
  const countryTextMap: Record<string, string> = {
    India: "Indian",
    "Sri Lanka": "Sri Lankan",
    UAE: "UAE",
    Malaysia: "Malaysian",
    "United Kingdom": "UK",
  };
  const countryText = countryTextMap[country] || country;
  return `Get your ${countryText} warehouse address`;
};

export function WarehousesSection() {
  return (
    <section id="warehouses" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Our{" "}
            <span className="text-primary animate-gradient">
              Global Warehouses
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            State-of-the-art facilities strategically located for optimal
            shipping and handling
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {warehouses.map((warehouse) => (
            <Card
              key={warehouse.city}
              className="overflow-hidden hover:shadow-2xl transition-shadow group"
            >
              <div className="relative aspect-video bg-gradient-to-br from-accent/40 to-accent/30">
                <Image
                  src={warehouse.image || "/home-page/placeholder.svg"}
                  alt={`${warehouse.city} Warehouse`}
                  width={500}
                  height={300}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-4 right-4 text-4xl">
                  {warehouse.flag}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{warehouse.city}</h3>
                  <p className="text-sm text-muted-foreground">
                    {warehouse.country}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{warehouse.address}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{warehouse.hours}</span>
                  </div>
                </div>

                <Button className="w-full bg-pink-gradient text-white hover:opacity-90 hover:scale-105 transition-all mt-4">
                  {getButtonText(warehouse.country)}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="font-bold mb-1">Secure Storage</div>
            <p className="text-sm text-muted-foreground">
              24/7 surveillance & climate control
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="font-bold mb-1">Expert Team</div>
            <p className="text-sm text-muted-foreground">
              Trained professionals handling your items
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="font-bold mb-1">Fast Processing</div>
            <p className="text-sm text-muted-foreground">
              24-48 hour turnaround time
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="font-bold mb-1">Insurance Available</div>
            <p className="text-sm text-muted-foreground">
              Protect your valuable shipments
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
