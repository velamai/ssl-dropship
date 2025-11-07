import { useAuth } from "@/contexts/auth-context";
import { userAddressApi } from "@/lib/api/user-addresses";
import { useQuery } from "@tanstack/react-query";

// Query keys
export const userAddressKeys = {
  all: ["user-addresses"] as const,
  lists: () => [...userAddressKeys.all, "list"] as const,
  list: (userId: string) => [...userAddressKeys.lists(), userId] as const,
  primary: () => [...userAddressKeys.all, "primary"] as const,
  primaryDetail: (userId: string) =>
    [...userAddressKeys.primary(), userId] as const,
  profile: () => [...userAddressKeys.all, "profile"] as const,
  profileDetail: (userId: string) =>
    [...userAddressKeys.profile(), userId] as const,
};

// Get all addresses for a user
export function useUserAddresses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: userAddressKeys.list(user?.id || ""),
    queryFn: () => userAddressApi.getUserAddresses(user?.id || ""),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id,
  });
}

// Get primary address for a user
export function usePrimaryUserAddress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: userAddressKeys.primaryDetail(user?.id || ""),
    queryFn: () => userAddressApi.getPrimaryAddress(user?.id || ""),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id,
  });
}

// Get user profile
export function useUserProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: userAddressKeys.profileDetail(user?.id || ""),
    queryFn: () => userAddressApi.getUserProfile(user?.id || ""),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id,
  });
}
