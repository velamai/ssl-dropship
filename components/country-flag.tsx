import Image from "next/image"

const LOCAL_FLAG_PATHS: Record<string, string> = {
  IN: "/flags/in.png",
  LK: "/flags/sl.png",
  AE: "/flags/uae.png",
  MY: "/flags/ml.png",
  GB: "/flags/uk.png",
  UK: "/flags/uk.png",
}

interface CountryFlagProps {
  countryCode: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function CountryFlag({ countryCode, className = "", size = "md" }: CountryFlagProps) {
  const code = countryCode?.toUpperCase().slice(0, 2) || ""
  if (!code) return null
  const localPath = LOCAL_FLAG_PATHS[code]
  const src = localPath || `https://flagsapi.com/${code}/flat/64.png`

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  }

  const pixelSize = sizeMap[size]

  return (
    <div
      className={`inline-flex overflow-hidden rounded-sm ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <Image
        src={src}
        alt={`Flag of ${countryCode}`}
        width={pixelSize}
        height={pixelSize}
        className="object-cover"
      />
    </div>
  )
}

