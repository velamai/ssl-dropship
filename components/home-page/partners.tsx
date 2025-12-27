import { PartnersColumn } from "./partners-column";

const pnartners = ["DHL", "FedEx", "UPS", "Aramex", "Blue Dart", "India Post"];

const partners = [
  {
    name: "DHL",
    color: "from-blue-500 to-cyan-400",
    description: "Mobile shopping app with budget-friendly deals worldwide",
    logo: "company/dhl.svg",
  },
  {
    name: "FedEx",
    color: "from-blue-600 to-yellow-400",
    description: "India's leading e-commerce platform for all categories",
    logo: "company/FedEx.svg",
  },
  {
    name: "UPS",
    color: "from-purple-600 to-pink-500",
    description: "Social commerce platform empowering resellers in India",
    logo: "company/ups.svg",
  },
  {
    name: "Aramex",
    color: "from-pink-600 to-purple-500",
    description: "Premier fashion and lifestyle shopping destination",
    logo: "company/aramex.svg",
  },
  {
    name: "Blue Dart",
    color: "from-orange-600 to-red-600",
    description: "Cross-border payment platform for global business",
    logo: "company/blue-dart.png",
  },
  {
    name: "India Post",
    color: "from-green-600 to-blue-500",
    description: "Seller-friendly marketplace for unique and artisan products",
    logo: "company/in-post.svg",
  },
];

const firstColumn = partners.slice(0, 2);
const secondColumn = partners.slice(2, 4);
const thirdColumn = partners.slice(4, 6);

export function Partners() {
  return (
    <section className="py-20 bg-gradient-to-br from-red-50 to-red-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Our Courier Partners
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We work with the world's leading courier services to ensure your
            packages reach safely
          </p>
        </div>

        <div className="hidden lg:flex flex-wrap justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <PartnersColumn partners={firstColumn} duration={22} />
          <PartnersColumn
            partners={secondColumn}
            className="hidden md:block"
            duration={24}
          />
          <PartnersColumn
            partners={thirdColumn}
            className="hidden md:block"
            duration={20}
          />
        </div>
        <div className="hidden md:flex  lg:hidden flex-wrap justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <PartnersColumn partners={partners.slice(0, 3)} duration={22} />
          <PartnersColumn
            partners={partners.slice(3, 6)}
            className="hidden md:block"
            duration={22}
          />
        </div>
        <div className="flex md:hidden flex-wrap justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <PartnersColumn partners={partners} duration={22} />
        </div>
      </div>
    </section>
  );
}
