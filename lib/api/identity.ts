import { getSupabaseBrowserClient } from "@/lib/supabase";

// Type definition for identity verification data
export type IdentityVerification = {
  status: string;
  rejection_reason?: string;
};

export type UserWithVerification = {
  identity_verification_id: string | null;
  is_identity_verified: boolean;
  identity_verification: IdentityVerification | null;
};

/**
 * Fetches identity verification data for a user
 * Includes verification status and rejection reason from the identity_verification table
 */
export const fetchIdentityVerificationData = async (userId: string) => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      identity_verification_id,
      is_identity_verified,
      identity_verification:identity_verification_id(status, rejection_reason)
      `
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  // Process the data to handle array/object response from join
  const result: UserWithVerification = {
    identity_verification_id: data?.identity_verification_id ?? null,
    is_identity_verified: data?.is_identity_verified ?? false,
    identity_verification: Array.isArray(data?.identity_verification)
      ? data?.identity_verification[0] || null
      : data?.identity_verification || null,
  };

  return { data: result };
};
