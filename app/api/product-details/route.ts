import { NextRequest, NextResponse } from "next/server";

// Product scraping API endpoint
// Uses basic HTML parsing - can be enhanced with Puppeteer if needed

interface ProductData {
  title: string;
  price: number;
  currency: string;
  image: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

// In-memory cache for request deduplication and caching
interface CacheEntry {
  data: ProductData;
  timestamp: number;
  promise?: Promise<ProductData>;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;

// Normalize URL for cache key
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query params that don't affect product data (like tracking params)
    urlObj.searchParams.delete("ref");
    urlObj.searchParams.delete("utm_source");
    urlObj.searchParams.delete("utm_medium");
    urlObj.searchParams.delete("utm_campaign");
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Fetch with timeout and retry logic
async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES,
  attempt = 1
): Promise<ProductData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Read response with timeout
    const htmlController = new AbortController();
    const htmlTimeoutId = setTimeout(() => htmlController.abort(), FETCH_TIMEOUT);
    
    let html: string;
    try {
      html = await response.text();
      clearTimeout(htmlTimeoutId);
    } catch (err) {
      clearTimeout(htmlTimeoutId);
      throw new Error("Timeout while reading response");
    }

    const hostname = new URL(url).hostname.toLowerCase();
    let productData: ProductData;

    // Parse based on domain - try site-specific parsers first, then generic
    if (hostname.includes("amazon")) {
      productData = parseAmazon(html);
    } else if (hostname.includes("ebay")) {
      productData = parseEbay(html);
    } else {
      // Try generic parser for all other sites
      productData = parseGeneric(html, hostname);
    }

    // Validate extracted data
    if (!productData.title || productData.title.trim() === "" || productData.price <= 0) {
      throw new Error("Invalid product data extracted");
    }

    return productData;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Check if it's an abort error (timeout)
    if (error.name === "AbortError" || error.message?.includes("Timeout")) {
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, retries, attempt + 1);
      }
      throw new Error("Request timeout: The website took too long to respond. Please try again.");
    }

    // Retry on network errors or 5xx errors
    if (attempt < retries && (error.message?.includes("fetch") || error.message?.includes("HTTP 5"))) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries, attempt + 1);
    }

    // Re-throw with better error message
    if (error.message?.includes("HTTP")) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || "Failed to fetch product details"}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const hostname = urlObj.hostname.toLowerCase();

    // Validate domain against e-commerce whitelist (import validation function logic)
    // We'll do a basic check here - full validation happens in validateProductUrl
    // But we add an extra layer here for API security
    const allowedDomains = [
      "amazon.in", "flipkart.com", "myntra.com", "ajio.com", "snapdeal.com", "meesho.com", "tatacliq.com", "nykaa.com", "shopclues.com", "paytmmall.com",
      "daraz.lk", "kapruka.com", "wow.lk", "mysurprise.lk", "ikman.lk",
      "amazon.ae", "noon.com", "namshi.com", "sharafdg.com", "carrefouruae.com", "mumzworld.com", "sivvi.com",
      "lazada.com.my", "shopee.com.my", "zalora.com.my", "pgmall.my", "mudah.my",
      "lazada.sg", "shopee.sg", "amazon.sg", "qoo10.sg", "carousell.sg", "ezbuy.sg",
      "amazon.com", "walmart.com", "target.com", "ebay.com", "bestbuy.com", "etsy.com", "wayfair.com", "overstock.com", "newegg.com", "macys.com",
    ];

    const isAllowedDomain = allowedDomains.some((domain) => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    // Also check for product page patterns as supplementary validation
    const productPagePatterns = [
      /\/product\//i, /\/p\//i, /\/dp\//i, /\/item\//i, /\/products\//i,
      /\/pd\//i, /\/prd\//i, /\/shop\//i, /\/buy\//i,
      /\/[a-z0-9-]+-p-\d+/i, /\?.*(?:product|item|sku|id)=/i,
    ];
    const hasProductPattern = productPagePatterns.some((pattern) => pattern.test(url));

    if (!isAllowedDomain && !hasProductPattern) {
      return NextResponse.json(
        { error: "This website is not a supported e-commerce platform. Only e-commerce sites from India, Sri Lanka, UAE, Malaysia, Singapore, and USA are supported." },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = normalizeUrl(url);
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      // Return cached data
      return NextResponse.json(cached.data);
    }

    // Check if there's an ongoing request for this URL (deduplication)
    if (cached?.promise) {
      try {
        const data = await cached.promise;
        return NextResponse.json(data);
      } catch {
        // If promise failed, continue to make new request
      }
    }

    // Create new fetch promise
    const fetchPromise = fetchWithRetry(url);
    
    // Store promise in cache for deduplication
    cache.set(cacheKey, {
      data: cached?.data || {} as ProductData,
      timestamp: cached?.timestamp || now,
      promise: fetchPromise,
    });

    try {
      const productData = await fetchPromise;
      
      // Update cache with successful result
      cache.set(cacheKey, {
        data: productData,
        timestamp: now,
      });

      return NextResponse.json(productData);
    } catch (error: any) {
      // Remove failed promise from cache
      cache.delete(cacheKey);
      
      // Determine error type and return appropriate message
      if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
        return NextResponse.json(
          { error: "Request timeout: The website took too long to respond. Please try again later." },
          { status: 504 }
        );
      }
      
      if (error.message?.includes("HTTP")) {
        return NextResponse.json(
          { error: error.message || "Unable to fetch product details from this website. Please contact administrator for assistance." },
          { status: 502 }
        );
      }

      console.error("Error fetching product details:", error);
      return NextResponse.json(
        { error: error.message || "Unable to fetch product details from this website. Please contact administrator for assistance." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in product details API:", error);
    
    // Handle specific error types
    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      return NextResponse.json(
        { error: "Request timeout: The website took too long to respond. Please try again later." },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Unable to fetch product details from this website. Please contact administrator for assistance." },
      { status: 500 }
    );
  }
}

function parseAmazon(html: string): ProductData {
  // Extract title
  const titleMatch =
    html.match(/<span[^>]*id="productTitle"[^>]*>(.*?)<\/span>/i) ||
    html.match(/<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
    html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
    : "Product";

  // Extract price - try multiple selectors
  let price = 0;
  let currency = "USD";

  // Amazon price patterns
  const pricePatterns = [
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([\d,]+)/i,
    /<span[^>]*id="priceblock_ourprice"[^>]*>([\d,]+)/i,
    /<span[^>]*id="priceblock_dealprice"[^>]*>([\d,]+)/i,
    /<span[^>]*class="[^"]*a-price[^"]*"[^>]*>.*?<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([\d,]+)/i,
    /"price":\s*"([\d.]+)"/i,
    /"priceAmount":\s*"([\d.]+)"/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 0) break;
    }
  }

  // Extract currency from page
  const currencyMatch = html.match(/"currencyCode":"([A-Z]{3})"/i) || html.match(/currency.*?([A-Z]{3})/i);
  if (currencyMatch) {
    currency = currencyMatch[1];
  } else {
    // Infer from domain
    if (html.includes("amazon.in")) currency = "INR";
    else if (html.includes("amazon.ae")) currency = "AED";
    else if (html.includes("amazon.com.my")) currency = "MYR";
  }

  // Extract image
  let image = "";
  const imagePatterns = [
    /<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i,
    /<img[^>]*data-old-src="([^"]+)"/i,
    /<img[^>]*data-src="([^"]+)"/i,
    /"mainImage":\s*"([^"]+)"/i,
  ];

  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match) {
      image = match[1];
      if (image) break;
    }
  }

  return {
    title,
    price,
    currency,
    image,
  };
}

function parseEbay(html: string): ProductData {
  // Extract title
  const titleMatch =
    html.match(/<h1[^>]*id="x-item-title-label"[^>]*>(.*?)<\/h1>/i) ||
    html.match(/<h1[^>]*class="[^"]*x-item-title-label[^"]*"[^>]*>(.*?)<\/h1>/i) ||
    html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
    : "Product";

  // Extract price
  let price = 0;
  let currency = "USD";

  const pricePatterns = [
    /<span[^>]*class="[^"]*notranslate[^"]*"[^>]*>([\d,]+\.?\d*)/i,
    /"price":\s*"([\d.]+)"/i,
    /"priceAmount":\s*"([\d.]+)"/i,
    /itemprop="price"[^>]*content="([\d.]+)"/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 0) break;
    }
  }

  // Extract currency
  const currencyMatch = html.match(/"currencyCode":"([A-Z]{3})"/i) || html.match(/currency.*?([A-Z]{3})/i);
  if (currencyMatch) {
    currency = currencyMatch[1];
  }

  // Extract image
  let image = "";
  const imagePatterns = [
    /<img[^>]*id="icImg"[^>]*src="([^"]+)"/i,
    /<img[^>]*itemprop="image"[^>]*src="([^"]+)"/i,
    /"imageUrl":\s*"([^"]+)"/i,
  ];

  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match) {
      image = match[1];
      if (image) break;
    }
  }

  return {
    title,
    price,
    currency,
    image,
  };
}

/**
 * Generic product parser for any e-commerce site
 * Uses multiple strategies: JSON-LD, Open Graph, common HTML patterns
 */
function parseGeneric(html: string, hostname: string): ProductData {
  let title = "";
  let price = 0;
  let currency = "USD";
  let image = "";

  // Strategy 1: JSON-LD structured data (most reliable)
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/, "").replace(/<\/script>/gi, "").trim();
        const data = JSON.parse(jsonContent);
        
        // Handle array of structured data
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"] === "http://schema.org/Product") {
            if (!title && item.name) {
              title = typeof item.name === "string" ? item.name : item.name[0] || "";
            }
            
            if (price <= 0 && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offers.price) {
                price = parseFloat(offers.price);
                if (offers.priceCurrency) {
                  currency = offers.priceCurrency;
                }
              }
            }
            
            if (!image && item.image) {
              image = typeof item.image === "string" ? item.image : (Array.isArray(item.image) ? item.image[0] : item.image.url || "");
            }
          }
        }
      } catch (e) {
        // Continue to next strategy if JSON parsing fails
      }
    }
  }

  // Strategy 2: Open Graph meta tags
  if (!title) {
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    }
  }

  if (price <= 0) {
    const ogPriceMatch = html.match(/<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i);
    if (ogPriceMatch) {
      price = parseFloat(ogPriceMatch[1]);
    }
    const ogCurrencyMatch = html.match(/<meta[^>]*property=["']og:price:currency["'][^>]*content=["']([^"']+)["']/i);
    if (ogCurrencyMatch) {
      currency = ogCurrencyMatch[1].toUpperCase();
    }
  }

  if (!image) {
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      image = ogImageMatch[1].trim();
    }
  }

  // Strategy 3: Common HTML patterns for title
  if (!title) {
    const titlePatterns = [
      /<h1[^>]*class=["'][^"']*product[^"']*title[^"']*["'][^>]*>(.*?)<\/h1>/i,
      /<h1[^>]*id=["'][^"']*product[^"']*title[^"']*["'][^>]*>(.*?)<\/h1>/i,
      /<h1[^>]*>(.*?)<\/h1>/i,
      /<title[^>]*>(.*?)<\/title>/i,
    ];
    
    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match) {
        title = match[1].replace(/<[^>]*>/g, "").trim();
        if (title) break;
      }
    }
  }

  // Strategy 4: Common HTML patterns for price
  if (price <= 0) {
    // Try to find price with currency symbols
    const pricePatterns = [
      /(?:price|cost|amount)[^>]*>[\s\S]*?([$₹€£]|USD|INR|AED|MYR|EUR|GBP)[\s:]*([\d,]+\.?\d*)/i,
      /<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>[\s\S]*?([\d,]+\.?\d*)/i,
      /<span[^>]*id=["'][^"']*price[^"']*["'][^>]*>[\s\S]*?([\d,]+\.?\d*)/i,
      /"price"[\s:]*"([\d.]+)"/i,
      /"priceAmount"[\s:]*"([\d.]+)"/i,
      /itemprop=["']price["'][^>]*content=["']([\d.]+)["']/i,
      /<meta[^>]*itemprop=["']price["'][^>]*content=["']([\d.]+)["']/i,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        const priceStr = match[match.length - 1].replace(/,/g, "");
        const parsedPrice = parseFloat(priceStr);
        if (parsedPrice > 0) {
          price = parsedPrice;
          
          // Try to extract currency from the match
          if (match[0]) {
            if (match[0].includes("₹") || match[0].includes("INR")) currency = "INR";
            else if (match[0].includes("AED") || match[0].includes("د.إ")) currency = "AED";
            else if (match[0].includes("MYR") || match[0].includes("RM")) currency = "MYR";
            else if (match[0].includes("SGD") || match[0].includes("S$")) currency = "SGD";
            else if (match[0].includes("LKR") || match[0].includes("Rs")) currency = "LKR";
            else if (match[0].includes("€") || match[0].includes("EUR")) currency = "EUR";
            else if (match[0].includes("£") || match[0].includes("GBP")) currency = "GBP";
            else if (match[0].includes("$") || match[0].includes("USD")) currency = "USD";
          }
          break;
        }
      }
    }
  }

  // Strategy 5: Currency detection from domain/hostname
  if (currency === "USD") {
    if (hostname.endsWith(".in") || hostname.includes(".in/")) {
      currency = "INR";
    } else if (hostname.endsWith(".ae") || hostname.includes(".ae/")) {
      currency = "AED";
    } else if (hostname.endsWith(".my") || hostname.includes(".my/")) {
      currency = "MYR";
    } else if (hostname.endsWith(".sg") || hostname.includes(".sg/")) {
      currency = "SGD";
    } else if (hostname.endsWith(".lk") || hostname.includes(".lk/")) {
      currency = "LKR";
    }
  }

  // Strategy 6: Common HTML patterns for image
  if (!image) {
    const imagePatterns = [
      /<img[^>]*class=["'][^"']*product[^"']*image[^"']*["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*id=["'][^"']*product[^"']*image[^"']*["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*itemprop=["']image["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*src=["']([^"']+)["'][^>]*itemprop=["']image["']/i,
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /"imageUrl"[\s:]*"([^"]+)"/i,
      /"mainImage"[\s:]*"([^"]+)"/i,
    ];

    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match) {
        image = match[1].trim();
        if (image && !image.startsWith("data:")) break; // Skip data URIs
      }
    }
  }

  return {
    title: title || "Product",
    price,
    currency,
    image,
  };
}

