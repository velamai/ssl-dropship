import { getSupabaseBrowserClient } from "@/lib/supabase";

export const fetchIdentityVerificationData = async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
        .from("users")
        .select("identity_verification_id, is_identity_verified")
        .eq("user_id", userId)
        .single();
    if (error) {
        throw error;
    }

    return { data };
};
