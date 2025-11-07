// Product scraper utility - extracts origin country from URL and fetches product data

export type OriginCountry = "india" | "malaysia" | "dubai" | "us";

export interface ProductData {
  title: string;
  price: number;
  currency: string;
  image: string;
  weight?: number; // in kg
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  originCountry: OriginCountry;
}

/**
 * Extract origin country from product URL domain
 */
export function extractOriginCountryFromUrl(url: string): OriginCountry {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Amazon domains
    if (hostname.includes("amazon.in")) {
      return "india";
    }
    if (hostname.includes("amazon.com.my")) {
      return "malaysia";
    }
    if (hostname.includes("amazon.ae")) {
      return "dubai";
    }
    if (hostname.includes("amazon.com")) {
      return "us";
    }

    // eBay domains
    if (hostname.includes("ebay.in")) {
      return "india";
    }
    if (hostname.includes("ebay.com")) {
      return "us";
    }

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
      weight: data.weight,
      dimensions: data.dimensions,
      originCountry,
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    throw error instanceof Error
      ? error
      : new Error(
          "Failed to fetch product details. Please check the URL and try again."
        );
  }
}

/**
 * Validate product URL
 */
export function validateProductUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url || url.trim() === "") {
    return { valid: false, error: "Product URL is required" };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if it's a supported domain
    const supportedDomains = [
      "amazon.com",
      "amazon.in",
      "amazon.ae",
      "amazon.com.my",
      "ebay.com",
      "ebay.in",
    ];

    const isSupported = supportedDomains.some((domain) =>
      hostname.includes(domain)
    );

    if (!isSupported) {
      return {
        valid: false,
        error:
          "Unable to fetch product details from this website. Please contact administrator for assistance.",
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid URL format" };
  }
}
