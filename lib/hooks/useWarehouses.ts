import { warehouseApi } from "@/lib/api/warehouses";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  return useQuery({
    queryKey: warehouseKeys.lists(),
    queryFn: warehouseApi.getWarehouses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
