import { useAuth } from "@/contexts/auth-context";
import {
  userAddressApi,
  type CreateAddressPayload,
  type UpdateAddressPayload,
} from "@/lib/api/user-addresses";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

// Create address mutation
export function useCreateAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || "";

  return useMutation({
    mutationFn: (payload: CreateAddressPayload) =>
      userAddressApi.createAddress(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userAddressKeys.list(userId) });
      queryClient.invalidateQueries({
        queryKey: userAddressKeys.primaryDetail(userId),
      });
    },
  });
}

// Update address mutation
export function useUpdateAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || "";

  return useMutation({
    mutationFn: ({
      addressId,
      payload,
    }: {
      addressId: string;
      payload: UpdateAddressPayload;
    }) => userAddressApi.updateAddress(userId, addressId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userAddressKeys.list(userId) });
      queryClient.invalidateQueries({
        queryKey: userAddressKeys.primaryDetail(userId),
      });
    },
  });
}

// Delete address mutation
export function useDeleteAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || "";

  return useMutation({
    mutationFn: (addressId: string) =>
      userAddressApi.deleteAddress(userId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userAddressKeys.list(userId) });
      queryClient.invalidateQueries({
        queryKey: userAddressKeys.primaryDetail(userId),
      });
    },
  });
}

// Set primary address mutation
export function useSetPrimaryAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || "";

  return useMutation({
    mutationFn: (addressId: string) =>
      userAddressApi.setPrimaryAddress(userId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userAddressKeys.list(userId) });
      queryClient.invalidateQueries({
        queryKey: userAddressKeys.primaryDetail(userId),
      });
    },
  });
}
