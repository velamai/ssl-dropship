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

