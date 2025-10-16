import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Ensure your environment variables are named like this in `.env.local`
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Type guard to check if the client is already initialized
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseBrowserClient = () => {
  if (!supabaseInstance) {
    // Basic check for environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase URL or Anon Key is missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file."
      );
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log("[Supabase Client] Initialized singleton browser instance.");
  }
  return supabaseInstance;
};

// Optional: Export the instance directly if you prefer this pattern
// export const supabase = getSupabaseBrowserClient();
