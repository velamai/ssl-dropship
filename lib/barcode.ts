// utils/barcode.ts

/**
 * Generate a PNG barcode as base64 from a string (URL, code, etc.)
 */
import QRCode from "qrcode";

// Create a canvas
//   const canvas = createCanvas(300, height);

// Generate barcode
//   JsBarcode(canvas, code, {
//     format: "CODE128",
//     width,
//     height,
//     displayValue: true, // hide text below barcode
//   });

// Return base64 PNG
export async function generateBarcode(code: string, width = 2, height = 75) {
  return await QRCode.toDataURL(code); // returns PNG base64
}
