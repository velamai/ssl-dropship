/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";
import { NextResponse } from "next/server";

const supabase = getSupabaseBrowserClient();

const CHROMIUM_PACK_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/chromium.tar`
  : "https://github.com/gabenunez/puppeteer-on-vercel/raw/refs/heads/main/example/chromium-dont-use-in-prod.tar";

// Cache the Chromium executable path to avoid re-downloading on subsequent requests
let cachedExecutablePath: string | null = null;
let downloadPromise: Promise<string> | null = null;

/**
 * Downloads and caches the Chromium executable path.
 * Uses a download promise to prevent concurrent downloads.
 */
async function getChromiumPath(): Promise<string> {
  // Return cached path if available
  if (cachedExecutablePath) return cachedExecutablePath;

  // Prevent concurrent downloads by reusing the same promise
  if (!downloadPromise) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    downloadPromise = chromium
      .executablePath(CHROMIUM_PACK_URL)
      .then((path) => {
        cachedExecutablePath = path;
        console.log("Chromium path resolved:", path);
        return path;
      })
      .catch((error) => {
        console.error("Failed to get Chromium path:", error);
        downloadPromise = null; // Reset on error to allow retry
        throw error;
      });
  }

  return downloadPromise;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shipment_id, user_id } = body;

    if (!shipment_id) {
      return NextResponse.json(
        { error: "shipment_id is required" },
        { status: 400 },
      );
    }

    // Fetch shipment data
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*")
      .eq("shipment_id", shipment_id)
      .eq("user_id", user_id)
      .single();

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: "Shipment not found", details: shipmentError?.message },
        { status: 404 },
      );
    }

    // Determine sender address
    let senderAddress = {
      address1: "",
      address2: "",
      address3: "",
      address4: "",
      postalCode: "",
      country: "",
    };

    type WarehouseAddress = {
      address_line1?: string;
      address_line2?: string;
      address_line3?: string;
      address_line4?: string;
      postal_code?: string;
      country?: string;
    };

    let warehouseAddress: WarehouseAddress | null = null;
    let addressError: { message: string } | null = null;

    if (shipment.drop_and_ship_warehouse_id) {
      const result = await supabase
        .from("warehouses")
        .select("*")
        .eq("warehouse_id", shipment.drop_and_ship_warehouse_id)
        .single();
      warehouseAddress = result.data as WarehouseAddress | null;
      addressError = result.error;
    } else if (shipment.drop_and_ship_source_country_code) {
      const countryCode =
        shipment.drop_and_ship_source_country_code.toUpperCase();
      const result = await supabase
        .from("warehouses")
        .select("*")
        .eq("country_code", countryCode)
        .limit(1);
      warehouseAddress = (result.data?.[0] as WarehouseAddress) ?? null;
      addressError = result.error;
    }
    if (!addressError && warehouseAddress) {
      senderAddress = {
        address1: warehouseAddress.address_line1 || "",
        address2: warehouseAddress.address_line2 || "",
        address3: warehouseAddress.address_line3 || "",
        address4: warehouseAddress.address_line4 || "",
        postalCode: warehouseAddress.postal_code || "",
        country: warehouseAddress.country || "",
      };
    }

    let receiverAddress = {
      address1: "",
      address2: "",
      address3: "",
      address4: "",
      postalCode: "",
      country: "",
    };

    const { data: userAddress } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", shipment.user_id)
      .eq("is_primary", true)
      .single();
    if (!addressError && userAddress) {
      receiverAddress = {
        address1: userAddress.address_line1 || "",
        address2: userAddress.address_line2 || "",
        address3: userAddress.address_line3 || "",
        address4: userAddress.address_line4 || "",
        postalCode: userAddress.pincode || "",
        country: userAddress.country || "",
      };
    }

    // Format mailType and senderReference
    const mailType = `Buy2Send - ${shipment.drop_and_ship_order_id || ""}${
      shipment.shipment_id || ""
    }`;
    const trackingId = `TRACKING ID - ${shipment.system_tracking_id || ""}`;
    const senderReference = `${shipment.drop_and_ship_order_id || ""}${
      shipment.shipment_id || ""
    }`;

    // Get tracking number for barcode
    const trackingNumber = shipment.system_tracking_id || "No Tracking Id";

    // Fetch shipment items for customs declaration
    const { data: shipmentItems } = await supabase
      .from("shipment_items")
      .select("*")
      .eq("shipment_id", shipment_id);

    // Calculate total quantity (count of items)
    const totalQuantity = shipmentItems?.length || 0;

    // Calculate total value in INR (sum of all total_price)
    const totalValueINR =
      shipmentItems?.reduce((sum, item) => {
        return sum + (parseFloat(item.total_price?.toString() || "0") || 0);
      }, 0) || 0;

    // Fetch USD exchange rate
    const { data: exchangeRate } = await supabase
      .from("exchange_currencies")
      .select("value")
      .eq("currency_code", "USD")
      .single();

    // Convert INR to USD (divide by exchange rate)
    const exchangeRateValue = parseFloat(
      exchangeRate?.value?.toString() || "20.00",
    );
    const totalValueUSD = totalValueINR / exchangeRateValue;

    const firstItem =
      shipmentItems && shipmentItems.length > 0 ? shipmentItems[0] : null;

    // Resolve 2-digit country codes to full names using countries table
    const senderCountryRaw = senderAddress.country || "";
    const recipientCountryRaw =
      shipment.shipment_country_code?.toUpperCase() || "";
    const codesToResolve: string[] = [];
    if (senderCountryRaw.length === 2)
      codesToResolve.push(senderCountryRaw.toUpperCase());
    if (recipientCountryRaw.length === 2)
      codesToResolve.push(recipientCountryRaw.toUpperCase());

    const countryCodeToName: Record<string, string> = {};
    if (codesToResolve.length > 0) {
      const { data: countriesData } = await supabase
        .from("countries")
        .select("code, name")
        .in("code", [...new Set(codesToResolve)]);
      if (countriesData) {
        for (const c of countriesData) {
          countryCodeToName[(c.code || "").toUpperCase()] = c.name || c.code;
        }
      }
    }

    const resolveCountry = (raw: string): string => {
      if (!raw) return "";
      if (raw.length === 2) {
        return countryCodeToName[raw.toUpperCase()] || raw;
      }
      return raw;
    };

    const senderCountryResolved = resolveCountry(senderCountryRaw);
    const recipientCountryResolved = resolveCountry(recipientCountryRaw);

    // Prepare label data
    const labelData = {
      // Sender Information
      senderName: "", // Will be filled from user data if needed
      senderAddress1: senderAddress.address1 || "",
      senderAddress2: senderAddress.address2 || "",
      senderAddress3: senderAddress.address3 || "",
      senderPostalCode: senderAddress.postalCode || "",
      senderCountry: senderCountryResolved || senderAddress.country || "",
      senderVatGst: "",

      // Recipient Information
      recipientName: `${shipment.receiver_first_name || ""} ${
        shipment.receiver_last_name || ""
      }`.trim(),
      recipientAddress1: shipment.receiver_address_line1 || "",
      recipientAddress2: shipment.receiver_address_line2 || "",
      recipientAddress3: shipment.receiver_address_line3 || "",
      recipientAddress4: shipment.receiver_address_line4 || "",
      recipientPostalCode: shipment.receiver_postal_code || "",
      recipientCountry:
        recipientCountryResolved ||
        shipment.shipment_country_code?.toUpperCase() ||
        "",
      recipientVatGst: shipment.receiver_tax || "",
      recipientPhone:
        shipment.receiver_phone_code && shipment.receiver_phone
          ? `${String(shipment.receiver_phone_code).startsWith("+") ? "" : "+"}${shipment.receiver_phone_code} ${shipment.receiver_phone}`
          : "",

      // Tracking Information
      trackingNumber: trackingNumber,

      // Customs Declaration
      designatedOperator: "Universal Mail",
      declarationType: "",
      contentDescription: "As Per Invoice",
      quantity: totalQuantity,
      weight: shipment.shipment_total_weight
        ? (shipment.shipment_total_weight / 1000).toFixed(3)
        : "0.100", // Convert grams to kg
      currency: "USD",
      value: totalValueUSD.toFixed(2),
      countryOfOrigin: "IN",
      hsTariff: firstItem?.hs_code || "As Per Invoice",
      senderReference: senderReference,
      totalWeight: shipment.shipment_total_weight
        ? (shipment.shipment_total_weight / 1000).toFixed(3)
        : "0.100",
      totalValue: totalValueUSD.toFixed(2),

      // Parcel Type
      parcelType: "Parcel:",
      mailType: mailType,
      trackingId: trackingId,
    };

    // Generate barcode for tracking number using jsbarcode
    const barcodeText = trackingNumber;
    const canvas = createCanvas(300, 80);
    JsBarcode(canvas, barcodeText, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: false,
    });
    const barcodeDataUrl = canvas.toDataURL("image/png");

    // HTML template matching the shipping label format
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipping Label</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 10px;
      line-height: 1.3;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 148.5mm;
      overflow: hidden;
    }
    
    .container {
      display: flex;
      width: 100%;
      height: 148.5mm;
      overflow: hidden;
    }
    
    .left-section {
      width: 50%;
      padding: 10px;
      border: 1px solid #000;
      box-sizing: border-box;
    }
    
    .right-section {
      width: 50%;
      padding: 10px;
      border: 1px solid #000;
      border-left: 2px solid #000;
      box-sizing: border-box;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    
    .from-section {
      flex: 1;
    }
    
    .logo {
      margin-left: 15px;
      flex-shrink: 0;
    }
    
    .logo img {
      max-width: 100px;
      height: auto;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 3px;
      font-size: 11px;
    }
    
    .address-block {
      margin-bottom: 8px;
    }
    
    .address-line {
      margin-bottom: 2px;
    }
    
    .vat-gst {
      margin-top: 10px;
      font-size: 10px;
    }
    
    .parcel-info {
      margin: 5px 0;
      font-weight: bold;
      font-size: 10px;
    }
    .parcel-info-content {
      margin: 2.5px 0;
      font-weight: normal;
      font-size: 10px;
    }
    
    .barcode-box {
      border: 2px solid #000;
      padding: 8px;
      margin: 10px 0;
      text-align: center;
      background: #fff;
    }
    
    .tracking-number {
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 4px;
      text-align: center;
      color: oklch(21% 0.006 285.885);
    }
    
    .barcode {
      width: 100%;
      max-width: 250px;
      height: auto;
      margin: 0 auto;
      display: block;
    }
    
    .barcode img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }
    
    .cn22-header {
      text-align: right;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .customs-title {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 5px;
    }
    
    .customs-instructions {
      font-size: 9px;
      margin-bottom: 10px;
    }
    
    .designated-operator {
      margin-bottom: 10px;
    }
    
    .declaration-type {
      margin-bottom: 15px;
    }
    
    .declaration-type label {
      margin-right: 15px;
      font-size: 10px;
    }
    
    .checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      margin-right: 5px;
      vertical-align: middle;
    }
    
    .checkbox.checked {
      background: #000;
      position: relative;
    }
    
    .checkbox.checked::after {
      content: 'X';
      position: absolute;
      top: -2px;
      left: 2px;
      color: #fff;
      font-size: 10px;
      font-weight: bold;
    }
    
    .content-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9px;
    }
    
    .content-table th,
    .content-table td {
      border: 1px solid #000;
      padding: 5px;
      text-align: left;
    }
    
    .content-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    
    .content-table .summary-row {
      border-top: 2px solid #000;
    }
    
    .content-table .summary-row td {
      padding: 6px 5px;
    }
    
    .others-input {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-width: 150px;
      margin-left: 5px;
      padding-bottom: 2px;
    }
    
    .declaration-statement {
      font-size: 8px;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    
    .signature-line {
      margin-top: 5px;
      padding-top: 3px;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Left Section: Shipping Label -->
    <div class="left-section">
      <div class="header-section">
        <div class="from-section">
          <div class="section-title">From:</div>
          <div class="address-block">
            <div class="address-line">${labelData.senderAddress1}</div>
            <div class="address-line">${labelData.senderAddress2}</div>
            <div class="address-line">${labelData.senderAddress3}</div>
            <div class="address-line">${labelData.senderPostalCode}</div>
            <div class="address-line">${labelData.senderCountry}</div>
            <div class="vat-gst">VAT/GST no: 33AAZFV5731C1ZX</div>          </div>
        </div>
        <div class="logo">
          <img src="https://www.buy2send.com/logo.png" alt="Quantium Solutions Logo" />
        </div>
      </div>
      
      <div class="parcel-info">Parcel:</div>
      <div class="parcel-info-content">${labelData.mailType}</div>
      <div class="parcel-info-content">${labelData.trackingId}</div>
      
     
       <div class="barcode-box" style="margin-top: 20px;">
        <div class="barcode">
          <img src="${barcodeDataUrl}" alt="Barcode" />
          <div class="tracking-number">${labelData.trackingNumber}</div>
        </div>
      </div>
      
      <div class="section-title">Send to:</div>
      <div class="address-block">
        <div class="address-line">${labelData.recipientName}</div>
        <div class="address-line">${labelData.recipientAddress1}</div>
        <div class="address-line">${labelData.recipientAddress2}</div>
        <div class="address-line">${labelData.recipientAddress3}</div>
        <div class="address-line">${labelData.recipientAddress4}</div>
        <div class="address-line">${labelData.recipientPostalCode}</div>
        <div class="address-line">${labelData.recipientCountry}</div>
        ${labelData.recipientPhone ? `<div class="address-line">Phone Number: ${labelData.recipientPhone}</div>` : ""}
      
      </div>
    
    </div>
    
    <!-- Right Section: Customs Declaration -->
    <div class="right-section">
      
      <div class="customs-title">CUSTOMS DECLARATIONS</div>
      <div class="customs-instructions">
        Item may be opened officially.. Important: See instructions. Tick where applicable.
      </div>
      
      <div class="designated-operator">
        <strong>Designated Operator:</strong> Buy2Send
      </div>
      
      <div class="declaration-type">
        <strong>Declaration Type:</strong><br>
        <label>
          <span class="checkbox ${
            labelData.declarationType === "Gift" ? "checked" : ""
          }"></span>
          Gift
        </label>
        <label>
          <span class="checkbox ${
            labelData.declarationType === "Merchandise" ? "checked" : ""
          }"></span>
          Merchandise
        </label>
        <label>
          <span class="checkbox ${
            labelData.declarationType === "Document" ? "checked" : ""
          }"></span>
          Document
        </label>
        <label>
          <span class="checkbox ${
            labelData.declarationType === "Sample" ? "checked" : ""
          }"></span>
          Sample
        </label>
        <label>
          <span class="checkbox ${
            labelData.declarationType === "Others" ? "checked" : ""
          }"></span>
          Others
          <span class="others-input"></span>
        </label>
      </div>
      
      <table class="content-table">
        <thead>
          <tr>
            <th>Content Description</th>
            <th>Quantity</th>
            <th>Weight (Kg)</th>
            <th>Currency</th>
            <th>Value</th>
            <th>Country of Origin</th>
            <th>HS Tariff</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>As Per Invoice</td>
            <td>${labelData.quantity}</td>
            <td>${labelData.weight}</td>
            <td>INR</td>
            <td>${labelData.value}</td>
            <td>IN</td>
            <td>${labelData.hsTariff}</td>
          </tr>
         
          
          <tr>
            <td colspan="7">
              Sender Reference: ${labelData.senderReference}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="declaration-statement">
        I have read, understood and agreed to the privacy notice, terms and conditions of posting. I certify the particulars given in this customs declaration are accurate and that the item does not contain any dangerous article or articles prohibited by legislation or by postal or custom regulations.
      </div>
      
      <div class="signature-line">
        Sender's Signature: _________________________
      </div>
      
      <div class="barcode-box" style="margin-top: 20px;">
        <div class="barcode">
          <img src="${barcodeDataUrl}" alt="Barcode" />
                    <div class="tracking-number">${labelData.trackingNumber}</div>

        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Configure browser based on environment
    const isVercel = !!process.env.VERCEL_ENV;
    let puppeteer: any;
    let launchOptions: any = {
      headless: true,
    };

    if (isVercel) {
      // Vercel: Use puppeteer-core with downloaded Chromium binary
      const chromium = (await import("@sparticuz/chromium-min")).default;
      puppeteer = await import("puppeteer-core");

      const executablePath = await getChromiumPath();

      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        executablePath,
      };

      console.log("Launching browser with executable path:", executablePath);
    } else {
      // Local: Use regular puppeteer with bundled Chromium
      puppeteer = await import("puppeteer");
    }

    // Launch browser
    let browser: any;
    try {
      browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();

      // Set content and wait for fonts/images to load
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
      });

      // Generate PDF - Half A4 size (210mm x 148.5mm)
      const pdfBuffer = await page.pdf({
        width: "210mm",
        height: "148.5mm", // Half of A4 height (297mm / 2 = 148.5mm)
        printBackground: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
        preferCSSPageSize: true,
      });

      // Return PDF as response
      return new NextResponse(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${shipment_id}.pdf"`,
        },
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      return NextResponse.json(
        {
          error: "Failed to generate PDF",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    } finally {
      // Always clean up browser resources
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error("Error in shipping label generation:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
