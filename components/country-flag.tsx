import { cn } from "@/lib/utils";
import Image from "next/image";

const LOCAL_FLAG_PATHS: Record<string, string> = {
  IN: "/flags/in.png",
  LK: "/flags/sl.png",
  AE: "/flags/uae.png",
  MY: "/flags/ml.png",
  GB: "/flags/uk.png",
  UK: "/flags/uk.png",
};

interface CountryFlagProps {
  countryCode: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  imageClassName?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export function CountryFlag({
  countryCode,
  className = "",
  size = "md",
  imageClassName = "",
  imageWidth,
  imageHeight,
}: CountryFlagProps) {
  const code = countryCode?.toUpperCase().slice(0, 2) || "";
  if (!code) return null;
  const localPath = LOCAL_FLAG_PATHS[code];
  const src = localPath || `https://flagsapi.com/${code}/flat/64.png`;

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const pixelSize = sizeMap[size];

  return (
    <div className={`inline-flex overflow-hidden rounded-sm ${className}`}>
      <Image
        src={src}
        alt={`Flag of ${countryCode}`}
        width={imageWidth || pixelSize}
        height={imageHeight || pixelSize}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
