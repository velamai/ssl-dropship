import { NextRequest, NextResponse } from "next/server";

// Product scraping API endpoint
// Uses basic HTML parsing - can be enhanced with Puppeteer if needed

interface ProductData {
  title: string;
  price: number;
  currency: string;
  image: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
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

    // Fetch product page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch product page: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    let productData: ProductData;

    // Parse based on domain
    if (hostname.includes("amazon")) {
      productData = parseAmazon(html);
    } else if (hostname.includes("ebay")) {
      productData = parseEbay(html);
    } else {
      return NextResponse.json({ error: "Unsupported domain" }, { status: 400 });
    }

    return NextResponse.json(productData);
  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch product details" },
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

  // Extract weight - try to find in product details
  // Handle kg, lbs, and grams - convert all to kg
  let weight: number | undefined;
  const weightPatterns = [
    // Weight in kg patterns
    /(?:weight|item weight|shipping weight|package weight)[^:]*:\s*(\d+\.?\d*)\s*(?:kg|kilogram|kilograms)/i,
    /(\d+\.?\d*)\s*(?:kg|kilogram|kilograms)(?:\s|$)/i,
    // Weight in lbs patterns (will convert to kg)
    /(?:weight|item weight|shipping weight|package weight)[^:]*:\s*(\d+\.?\d*)\s*(?:lb|lbs|pound|pounds)/i,
    /(\d+\.?\d*)\s*(?:lb|lbs|pound|pounds)(?:\s|$)/i,
    // Weight in grams patterns (will convert to kg)
    /(?:weight|item weight|shipping weight|package weight)[^:]*:\s*(\d+\.?\d*)\s*(?:g|gram|grams|gm|gms)/i,
    /(\d+\.?\d*)\s*(?:g|gram|grams|gm|gms)(?:\s|$)/i,
    // JSON/API patterns
    /"weight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:kg|kilogram)"/i,
    /"weight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:lb|lbs|pound)"/i,
    /"weight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:g|gram|grams)"/i,
    /"itemWeight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:kg|kilogram)"/i,
    /"itemWeight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:lb|lbs|pound)"/i,
    /"itemWeight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:g|gram|grams)"/i,
    // Amazon specific patterns
    /<span[^>]*class="[^"]*a-size-base[^"]*"[^>]*>.*?(?:weight|Weight)[^:]*:\s*(\d+\.?\d*)\s*(kg|lb|lbs|g|gram|grams|gm|gms)/i,
    /<li[^>]*class="[^"]*a-spacing-mini[^"]*"[^>]*>.*?(?:weight|Weight)[^:]*:\s*(\d+\.?\d*)\s*(kg|lb|lbs|g|gram|grams|gm|gms)/i,
  ];

  for (const pattern of weightPatterns) {
    const match = html.match(pattern);
    if (match) {
      const weightValue = parseFloat(match[1]);
      if (weightValue > 0) {
        const matchText = match[0].toLowerCase();
        const unitMatch = match[2] ? match[2].toLowerCase() : "";
        
        // Check if it's in lbs
        const isLbs = 
          matchText.includes("lb") || 
          matchText.includes("pound") ||
          unitMatch.includes("lb") || 
          unitMatch.includes("pound");
        
        // Check if it's in grams
        const isGrams = 
          matchText.includes("g") && !matchText.includes("kg") ||
          unitMatch.includes("g") && !unitMatch.includes("kg") ||
          matchText.includes("gram") ||
          unitMatch.includes("gram");
        
        if (isLbs) {
          // Convert lbs to kg (1 lb = 0.453592 kg)
          weight = weightValue * 0.453592;
        } else if (isGrams) {
          // Convert grams to kg (1 gram = 0.001 kg)
          weight = weightValue * 0.001;
        } else {
          // Already in kg
          weight = weightValue;
        }
        break;
      }
    }
  }
  
  // If still no weight found, try more generic patterns
  if (!weight) {
    const genericPatterns = [
      /(\d+\.?\d*)\s*(?:kg|kilogram|kilograms)/gi,
      /(\d+\.?\d*)\s*(?:lb|lbs|pound|pounds)/gi,
      /(\d+\.?\d*)\s*(?:g|gram|grams|gm|gms)(?![a-z])/gi, // Negative lookahead to avoid matching "kg"
    ];
    
    for (const pattern of genericPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const weightValue = parseFloat(match[1]);
        const matchText = match[0].toLowerCase();
        
        // Reasonable weight range check (adjust based on unit)
        const isLbs = matchText.includes("lb") || matchText.includes("pound");
        const isGrams = (matchText.includes("g") || matchText.includes("gram")) && !matchText.includes("kg");
        
        if (weightValue > 0) {
          if (isGrams && weightValue < 500000) { // Reasonable range for grams (up to 500kg)
            // Convert grams to kg (1 gram = 0.001 kg)
            weight = weightValue * 0.001;
          } else if (isLbs && weightValue < 1100) { // Reasonable range for lbs (up to 500kg)
            // Convert lbs to kg (1 lb = 0.453592 kg)
            weight = weightValue * 0.453592;
          } else if (!isLbs && !isGrams && weightValue < 500) { // Reasonable range for kg
            weight = weightValue;
          }
          
          if (weight) break;
        }
      }
      if (weight) break;
    }
  }

  return {
    title,
    price,
    currency,
    image,
    weight,
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

  // Extract weight - handle kg, lbs, and grams - convert all to kg
  let weight: number | undefined;
  const weightPatterns = [
    // Weight in kg patterns
    /(?:weight|item weight|shipping weight|package weight)[^:]*:\s*(\d+\.?\d*)\s*(?:kg|kilogram|kilograms)/i,
    /(\d+\.?\d*)\s*(?:kg|kilogram|kilograms)(?:\s|$)/i,
    // Weight in lbs patterns (will convert to kg)
    /(?:weight|item weight|shipping weight|package weight)[^:]*:\s*(\d+\.?\d*)\s*(?:lb|lbs|pound|pounds)/i,
    /(\d+\.?\d*)\s*(?:lb|lbs|pound|pounds)(?:\s|$)/i,
    // Weight in grams patterns (will convert to kg)
    /(?:weight|item weight|shipping weight|package weight)[^:]*:\s*(\d+\.?\d*)\s*(?:g|gram|grams|gm|gms)/i,
    /(\d+\.?\d*)\s*(?:g|gram|grams|gm|gms)(?:\s|$)/i,
    // JSON/API patterns
    /"weight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:kg|kilogram)"/i,
    /"weight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:lb|lbs|pound)"/i,
    /"weight":\s*"([\d.]+)"\s*,\s*"unit":\s*"(?:g|gram|grams)"/i,
  ];

  for (const pattern of weightPatterns) {
    const match = html.match(pattern);
    if (match) {
      const weightValue = parseFloat(match[1]);
      if (weightValue > 0) {
        const matchText = match[0].toLowerCase();
        
        // Check if it's in lbs
        const isLbs = 
          matchText.includes("lb") || 
          matchText.includes("pound");
        
        // Check if it's in grams (but not kg)
        const isGrams = 
          (matchText.includes("g") || matchText.includes("gram")) && 
          !matchText.includes("kg");
        
        if (isLbs) {
          // Convert lbs to kg (1 lb = 0.453592 kg)
          weight = weightValue * 0.453592;
        } else if (isGrams) {
          // Convert grams to kg (1 gram = 0.001 kg)
          weight = weightValue * 0.001;
        } else {
          // Already in kg
          weight = weightValue;
        }
        break;
      }
    }
  }
  
  // If still no weight found, try more generic patterns
  if (!weight) {
    const genericPatterns = [
      /(\d+\.?\d*)\s*(?:kg|kilogram|kilograms)/gi,
      /(\d+\.?\d*)\s*(?:lb|lbs|pound|pounds)/gi,
      /(\d+\.?\d*)\s*(?:g|gram|grams|gm|gms)(?![a-z])/gi, // Negative lookahead to avoid matching "kg"
    ];
    
    for (const pattern of genericPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const weightValue = parseFloat(match[1]);
        const matchText = match[0].toLowerCase();
        
        // Reasonable weight range check (adjust based on unit)
        const isLbs = matchText.includes("lb") || matchText.includes("pound");
        const isGrams = (matchText.includes("g") || matchText.includes("gram")) && !matchText.includes("kg");
        
        if (weightValue > 0) {
          if (isGrams && weightValue < 500000) { // Reasonable range for grams (up to 500kg)
            // Convert grams to kg (1 gram = 0.001 kg)
            weight = weightValue * 0.001;
          } else if (isLbs && weightValue < 1100) { // Reasonable range for lbs (up to 500kg)
            // Convert lbs to kg (1 lb = 0.453592 kg)
            weight = weightValue * 0.453592;
          } else if (!isLbs && !isGrams && weightValue < 500) { // Reasonable range for kg
            weight = weightValue;
          }
          
          if (weight) break;
        }
      }
      if (weight) break;
    }
  }

  return {
    title,
    price,
    currency,
    image,
    weight,
  };
}

