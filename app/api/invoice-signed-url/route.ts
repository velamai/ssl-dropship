import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

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

function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return "pdf"; // fallback to pdf for safety
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileType } = await request.json();

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only PDF and image files are allowed.",
        },
        { status: 400 }
      );
    }

    const uuid = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = getFileExtension(fileType);
    const generatedFileName = `${uuid}-${timestamp}.${extension}`;

    const key = `production-invoices/${new Date().getFullYear()}/${generatedFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ContentLength: undefined,
      ACL: "public-read",
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

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

// New endpoint for multiple file uploads
export async function PUT(request: NextRequest) {
  try {
    const { fileTypes } = await request.json();

    if (!Array.isArray(fileTypes) || fileTypes.length === 0) {
      return NextResponse.json(
        {
          error: "fileTypes must be a non-empty array.",
        },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    // Validate all file types
    for (const fileType of fileTypes) {
      if (!allowedTypes.includes(fileType)) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${fileType}. Only PDF and image files are allowed.`,
          },
          { status: 400 }
        );
      }
    }

    const results = [];

    for (const fileType of fileTypes) {
      const uuid = uuidv4();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const extension = getFileExtension(fileType);
      const generatedFileName = `${uuid}-${timestamp}.${extension}`;

      const key = `production-invoices/${new Date().getFullYear()}/${generatedFileName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: fileType,
        ContentLength: undefined,
        ACL: "public-read",
      });

      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

      const publicUrl = `https://ssl-drop-and-ship.2fc6a444d1c5ee247050bb888bcf2e28.r2.cloudflarestorage.com/${key}`;

      results.push({
        signedUrl,
        key,
        publicUrl,
        fileName: generatedFileName,
      });
    }

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error("Multiple signed URLs generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URLs" },
      { status: 500 }
    );
  }
}
