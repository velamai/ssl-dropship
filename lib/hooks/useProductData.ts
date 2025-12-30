import { useQuery } from "@tanstack/react-query";
import { fetchProductData, validateProductUrl, type ProductData } from "@/lib/product-scraper";

// Query keys
export const productDataKeys = {
  all: ["productData"] as const,
  detail: (url: string) => [...productDataKeys.all, "detail", url] as const,
};

/**
 * React Query hook for fetching product data
 * Includes proper caching, retry logic, and error handling
 */
export function useProductData(url: string | null) {
  const trimmedUrl = url?.trim() || "";
  const isValidUrl = trimmedUrl.length > 0 && trimmedUrl.startsWith("http");
  
  // Validate URL before making request
  const validation = trimmedUrl ? validateProductUrl(trimmedUrl) : { valid: false };
  const shouldFetch = isValidUrl && validation.valid;

  return useQuery({
    queryKey: productDataKeys.detail(trimmedUrl),
    queryFn: () => fetchProductData(trimmedUrl),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3, // Retry 3 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s (max 30s)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
}





