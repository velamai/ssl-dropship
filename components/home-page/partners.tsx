import { PartnersColumn } from "./partners-column";

const partners = [
  {
    name: "Amazon",
    color: "from-orange-500 to-yellow-400",
    description: "World's largest online marketplace with millions of products",
    logo: "company/amazon.svg",
  },
  {
    name: "Etsy",
    color: "from-green-600 to-teal-500",
    description: "Global marketplace for unique and handmade products",
    logo: "company/etsy.svg",
  },
  {
    name: "eBay",
    color: "from-blue-600 to-red-500",
    description: "Online auction and shopping platform for new and used items",
    logo: "company/ebay.svg",
  },
  {
    name: "Flipkart",
    color: "from-blue-500 to-yellow-400",
    description: "India's leading e-commerce platform for all categories",
    logo: "company/flipkart.svg",
  },
  {
    name: "Shopify",
    color: "from-green-500 to-teal-600",
    description: "Complete e-commerce platform for online stores",
    logo: "company/shopify.svg",
  },
  {
    name: "Daraz",
    color: "from-red-500 to-orange-500",
    description: "Leading online marketplace in South Asia",
    logo: "company/daraz-seeklogo.svg",
  },
  {
    name: "Lazada",
    color: "from-blue-500 to-orange-400",
    description: "Southeast Asia's leading e-commerce platform",
    logo: "company/1024px-Lazada_(2019).svg.png",
  },
  {
    name: "Meesho",
    color: "from-pink-500 to-purple-500",
    description: "Social commerce platform empowering resellers in India",
    logo: "company/meesho.svg",
  },
  {
    name: "Walmart",
    color: "from-blue-600 to-blue-400",
    description: "American multinational retail corporation",
    logo: "company/walmart.svg",
  },
];

const firstColumn = partners.slice(0, 3);
const secondColumn = partners.slice(3, 6);
const thirdColumn = partners.slice(6, 9);

export function Partners() {
  return (
    <section className="py-20 bg-gradient-to-br from-red-50 to-red-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            E-commerce Supported Platforms
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Shop from your favorite e-commerce platforms worldwide
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
          <PartnersColumn
            partners={partners.slice(6, 9)}
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
