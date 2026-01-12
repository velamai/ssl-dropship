import { useQuery } from "@tanstack/react-query";
import { countriesApi } from "@/lib/api/countries";

// Query keys
export const countriesKeys = {
  all: ["countries"] as const,
  lists: () => [...countriesKeys.all, "list"] as const,
};

// Get all countries
export function useCountries() {
  return useQuery({
    queryKey: countriesKeys.lists(),
    queryFn: () => countriesApi.getCountries(),
    staleTime: 10 * 60 * 1000, // 10 minutes - countries don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
