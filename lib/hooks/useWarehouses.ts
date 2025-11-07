import { useAuth } from "@/contexts/auth-context";
import { warehouseApi } from "@/lib/api/warehouses";
import { useQuery } from "@tanstack/react-query";

// Query keys
export const warehouseKeys = {
  all: ["warehouses"] as const,
  lists: () => [...warehouseKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...warehouseKeys.lists(), { filters }] as const,
  details: () => [...warehouseKeys.all, "detail"] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
};

// Get all warehouses
export function useWarehouses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: warehouseKeys.lists(),
    queryFn: () => warehouseApi.getWarehouses(user?.id || ""),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id,
  });
}

// Get a single warehouse
export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehouseApi.getWarehouse(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
