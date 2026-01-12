import { useQuery } from "@tanstack/react-query";
import { sourceCountriesApi } from "@/lib/api/source-countries";

// Query keys
export const sourceCountriesKeys = {
  all: ["sourceCountries"] as const,
  lists: () => [...sourceCountriesKeys.all, "list"] as const,
};

// Get all source countries
export function useSourceCountries() {
  return useQuery({
    queryKey: sourceCountriesKeys.lists(),
    queryFn: () => sourceCountriesApi.getSourceCountries(),
    staleTime: 10 * 60 * 1000, // 10 minutes - source countries don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
