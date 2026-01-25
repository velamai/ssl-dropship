type CurrencyType = "USD" | "INR" | "LKR" | "GBD" | "AED" | "MYR";

const countryCodeToCurrency = [
  { code: "US", currency: "USD" },
  { code: "IN", currency: "INR" },
  { code: "LK", currency: "LKR" },
  { code: "GB", currency: "GBD" },
  { code: "AE", currency: "AED" },
  { code: "MY", currency: "MYR" },
];

export const currenciesToCountryCode = (currency: CurrencyType) => {
  const mapping = countryCodeToCurrency.find((c) => c.currency === currency);
  return mapping ? mapping.code : null;
};

export const countryCodeToCurrencies = (countryCode: string) => {
  const mapping = countryCodeToCurrency.find((c) => c.code === countryCode);
  return mapping ? mapping.currency : null;
};
