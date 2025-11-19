// Example: /auth/callback page (React/Next.js)
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase automatically handles the token from the URL
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error:", error);
        router.push("/login?error=confirmation_failed");
        return;
      }

      if (data.session) {
        // User is confirmed and logged in!
        router.push("/shipments"); // or wherever you want to redirect
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>Confirming your email...</h2>
      <p>Please wait while we verify your account.</p>
    </div>
  );
}
