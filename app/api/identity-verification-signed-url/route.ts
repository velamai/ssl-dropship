import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// Initialize S3-compatible R2 client
// https://2fc6a444d1c5ee247050bb888bcf2e28.r2.cloudflarestorage.com/
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://2fc6a444d1c5ee247050bb888bcf2e28.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "33138c7c069c482f9a55f61248ad1cef",
    secretAccessKey:
      "21b9854867643fa7e2450b9db9edfd73bc717d3e66b85bdb8cb4f1d78558dac2",
  },
});

const BUCKET_NAME = "ssl-drop-and-ship";

// Helper function to get file extension from MIME type
function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "jpg"; // fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileType } = await request.json();

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only PNG, JPG, JPEG, and WebP are allowed.",
        },
        { status: 400 }
      );
    }

    // Generate UUID + datetime filename with proper extension
    const uuid = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = getFileExtension(fileType);
    const generatedFileName = `${uuid}-${timestamp}.${extension}`;

    // Construct the key with organized folder structure
    const key = `identity-verification/${new Date().getFullYear()}/${generatedFileName}`;

    // Create the command for signed URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ContentLength: undefined,
      ACL: "public-read",
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Construct the public URL that will be accessible after upload
    const publicUrl = `https://ssl-drop-and-ship.2fc6a444d1c5ee247050bb888bcf2e28.r2.cloudflarestorage.com/${key}`;

    return NextResponse.json({
      signedUrl,
      key,
      publicUrl,
      fileName: generatedFileName,
    });
  } catch (error) {
    console.error("Signed URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
