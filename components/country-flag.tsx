import Image from "next/image"

interface CountryFlagProps {
  countryCode: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function CountryFlag({ countryCode, className = "", size = "md" }: CountryFlagProps) {
  // Convert country code to lowercase for the API
  const code = countryCode.toLowerCase()

  // Size mapping
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
        src={`https://flagcdn.com/w40/${code}.png`}
        alt={`Flag of ${countryCode}`}
        width={pixelSize}
        height={pixelSize}
        className="object-cover"
      />
    </div>
  )
}

