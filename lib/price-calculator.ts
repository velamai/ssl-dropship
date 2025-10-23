// Price calculator types
export type CourierService = {
  courier_service_id: string
  name: string
  description?: string
  exchange_currency_id?: string
  image_url?: string
  instruction?: string
  transhipment_time?: string
  countries: { code: string; name: string; zone: number }[]
  rates: Record<string, { price: number; weight: number }[]>
  updated_at?: string
  created_at?: string
  type: string // "import" or "export"
  min_weight: number
  max_weight: number
  adding_value: number
  excel_file_url?: string
}

export type Currency = {
  exchange_currency_id: string
  name: string
  currency_code: string
  value: number
  created_at?: string
  updated_at?: string
}

export type PriceCalculatorInput = {
  from: string
  selected_to: string
  selected_courier_service: string | null
  selected_type: string // "import" or "export"
  selected_weight: number
  selected_volume: number
  currency: Currency[]
  Allcourierservicesdata: CourierService[]
}

export type PriceCalculationResult = {
  transportable: boolean
  prices?: Array<{
    courier_service_id: string
    name: string
    description?: string
    exchange_currency_id?: string
    image_url?: string
    instruction?: string
    transhipment_time?: string
    final_weight: number
    finalPrice: number
    dimensionPrice: number
    weightPrice: number
    currency: string
  }>
}

// Helper functions
export function adjustWeight(weight: number, min_weight: number, adding_value: number): number {
  if (weight < min_weight) return min_weight
  return Math.ceil(weight / adding_value) * adding_value
}

export function findZonePrice(courier: CourierService, countryCode: string, weight: number): number | null {
  const country = courier.countries.find((c) => c.code === countryCode)
  if (!country) return null

  const zoneRates = courier.rates[`zone${country.zone}`] || []
  for (let i = 0; i < zoneRates.length; i++) {
    if (weight <= zoneRates[i].weight) {
      return zoneRates[i].price
    }
  }
  return null
}

// Main price calculation function
export function calculatePrice(input: PriceCalculatorInput): PriceCalculationResult {
  let availableCouriers = input.Allcourierservicesdata

  if (input.selected_courier_service) {
    availableCouriers = availableCouriers.filter((c) => c.courier_service_id === input.selected_courier_service)
    if (availableCouriers.length === 0) {
      return { transportable: false }
    }
  }

  availableCouriers = availableCouriers.filter((c) => c.type === input.selected_type)
  if (availableCouriers.length === 0) {
    return { transportable: false }
  }

  availableCouriers = availableCouriers
    .map((c) => {
      const adjustedWeight = adjustWeight(input.selected_weight, c.min_weight, c.adding_value)
      return { ...c, adjustedWeight }
    })
    .filter((c) => c.adjustedWeight >= c.min_weight && c.adjustedWeight <= c.max_weight)

  if (availableCouriers.length === 0) {
    return { transportable: false }
  }

  availableCouriers = availableCouriers.filter((c) => c.countries.some((country) => country.code === input.selected_to))
  if (availableCouriers.length === 0) {
    return { transportable: false }
  }

  const prices = availableCouriers
    .map((c) => {
      const price = findZonePrice(c, input.selected_to, c.adjustedWeight)
      if (price === null) return null

      const selectedCurrency = input.currency.find((curr) => curr.exchange_currency_id === c.exchange_currency_id)
      const currencyValue = selectedCurrency ? selectedCurrency.value : 1

      const convertedPrice = price * currencyValue
      const volumeCurrency = input.currency.find(
        (curr) => curr.exchange_currency_id === "3302e366-89b9-487b-b8ce-b598d21be29d",
      )
      const volumeCurrencyValue = volumeCurrency ? volumeCurrency.value : 1
      const volumePrice = input.selected_volume * 2.5 * volumeCurrencyValue
      const finalPrice = Math.max(convertedPrice, volumePrice)

      return {
        courier_service_id: c.courier_service_id,
        name: c.name,
        description: c.description,
        exchange_currency_id: c.exchange_currency_id,
        image_url: c.image_url,
        instruction: c.instruction,
        transhipment_time: c.transhipment_time,
        final_weight: c.adjustedWeight,
        finalPrice: finalPrice,
        dimensionPrice: volumePrice,
        weightPrice: convertedPrice,
        currency: selectedCurrency ? selectedCurrency.currency_code : "Unknown",
      }
    })
    .filter((p) => p !== null)

  return prices.length > 0 ? { transportable: true, prices: prices as any } : { transportable: false }
}

