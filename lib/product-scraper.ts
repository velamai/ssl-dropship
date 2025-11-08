// Product scraper utility - extracts origin country from URL and fetches product data

export type OriginCountry = "india" | "malaysia" | "dubai" | "us" | "srilanka" | "singapore";

/**
 * E-commerce domain whitelist organized by country
 * Only domains from these countries are allowed
 */
const ECOMMERCE_DOMAINS: Record<string, string[]> = {
  india: [
    "amazon.in",
    "flipkart.com",
    "myntra.com",
    "ajio.com",
    "snapdeal.com",
    "meesho.com",
    "tatacliq.com",
    "nykaa.com",
    "shopclues.com",
    "paytmmall.com",
  ],
  srilanka: [
    "daraz.lk",
    "kapruka.com",
    "wow.lk",
    "mysurprise.lk",
    "ikman.lk",
  ],
  uae: [
    "amazon.ae",
    "noon.com",
    "namshi.com",
    "sharafdg.com",
    "carrefouruae.com",
    "mumzworld.com",
    "sivvi.com",
  ],
  malaysia: [
    "lazada.com.my",
    "shopee.com.my",
    "zalora.com.my",
    "pgmall.my",
    "mudah.my",
  ],
  singapore: [
    "lazada.sg",
    "shopee.sg",
    "amazon.sg",
    "qoo10.sg",
    "carousell.sg",
    "ezbuy.sg",
  ],
  usa: [
    "amazon.com",
    "walmart.com",
    "target.com",
    "ebay.com",
    "bestbuy.com",
    "etsy.com",
    "wayfair.com",
    "overstock.com",
    "newegg.com",
    "macys.com",
  ],
};

/**
 * Common e-commerce URL patterns that indicate product pages
 * Used as supplementary validation when domain is not in whitelist
 */
const PRODUCT_PAGE_PATTERNS = [
  /\/product\//i,
  /\/p\//i,
  /\/dp\//i,
  /\/item\//i,
  /\/products\//i,
  /\/pd\//i,
  /\/prd\//i,
  /\/shop\//i,
  /\/buy\//i,
  /\/[a-z0-9-]+-p-\d+/i, // Pattern like "product-name-p-12345"
  /\?.*(?:product|item|sku|id)=/i, // Query parameters
];

export interface ProductData {
  title: string;
  price: number;
  currency: string;
  image: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  originCountry: OriginCountry;
}

/**
 * Check if domain matches e-commerce whitelist and return country
 */
export function isEcommerceDomain(hostname: string): { valid: boolean; country?: string; error?: string } {
  const normalizedHostname = hostname.toLowerCase();

  // Check each country's domain list
  for (const [country, domains] of Object.entries(ECOMMERCE_DOMAINS)) {
    for (const domain of domains) {
      // Check if hostname matches domain (exact match or subdomain)
      if (normalizedHostname === domain || normalizedHostname.endsWith(`.${domain}`)) {
        return { valid: true, country };
      }
    }
  }

  return {
    valid: false,
    error: "This website is not a supported e-commerce platform. Only e-commerce sites from India, Sri Lanka, UAE, Malaysia, Singapore, and USA are supported.",
  };
}

/**
 * Check if URL path matches common e-commerce product page patterns
 * Used as supplementary validation
 */
function hasProductPagePattern(url: string): boolean {
  return PRODUCT_PAGE_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Extract origin country from product URL domain
 * Returns country code based on e-commerce domain whitelist
 */
export function extractOriginCountryFromUrl(url: string): OriginCountry {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check against e-commerce domain whitelist
    const domainCheck = isEcommerceDomain(hostname);
    if (domainCheck.valid && domainCheck.country) {
      // Map country names to OriginCountry type
      const countryMap: Record<string, OriginCountry> = {
        india: "india",
        srilanka: "srilanka",
        uae: "dubai", // UAE maps to dubai
        malaysia: "malaysia",
        singapore: "singapore",
        usa: "us",
      };
      return countryMap[domainCheck.country] || "us";
    }

    // Fallback: try to infer from TLD (for backward compatibility)
    if (hostname.endsWith(".in")) return "india";
    if (hostname.endsWith(".lk")) return "srilanka";
    if (hostname.endsWith(".ae")) return "dubai";
    if (hostname.endsWith(".my")) return "malaysia";
    if (hostname.endsWith(".sg")) return "singapore";
    if (hostname.endsWith(".com")) return "us";

    // Default to US if unknown
    return "us";
  } catch (error) {
    console.error("Error parsing URL:", error);
    return "us"; // Default fallback
  }
}

/**
 * Fetch product data from backend API
 */
export async function fetchProductData(url: string): Promise<ProductData> {
  try {
    const response = await fetch("/api/product-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Failed to fetch product data: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Extract origin country from URL
    const originCountry = extractOriginCountryFromUrl(url);

    return {
      title: data.title || "Product",
      price: data.price || 0,
      currency: data.currency || "USD",
      image: data.image || "",
      dimensions: data.dimensions,
      originCountry,
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    // Preserve the error message from API (which includes "contact administrator" message)
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      "Unable to fetch product details from this website. Please contact administrator for assistance."
    );
  }
}

/**
 * Validate product URL
 * Uses combined approach: Domain Whitelist + Pattern-Based Detection
 */
export function validateProductUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url || url.trim() === "") {
    return { valid: false, error: "Product URL is required" };
  }

  try {
    // Step 1: Validate URL format
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Step 2: Check if domain is in e-commerce whitelist (Primary validation)
    const domainCheck = isEcommerceDomain(hostname);
    if (domainCheck.valid) {
      // Domain is in whitelist, proceed
      return { valid: true };
    }

    // Step 3: Pattern-Based Detection (Supplementary validation)
    // If domain not in whitelist, check for common e-commerce URL patterns
    if (hasProductPagePattern(url)) {
      // URL has product page pattern but domain not in whitelist
      // Allow it but will be validated during scraping
      return {
        valid: true,
      };
    }

    // Step 4: Domain not in whitelist and no product page pattern found
    return {
      valid: false,
      error: domainCheck.error || "This website is not a supported e-commerce platform. Only e-commerce sites from India, Sri Lanka, UAE, Malaysia, Singapore, and USA are supported.",
    };
  } catch (error) {
    return { valid: false, error: "Invalid URL format" };
  }
}
