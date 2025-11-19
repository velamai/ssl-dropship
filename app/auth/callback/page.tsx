"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous callback processing
    if (hasProcessedRef.current || isProcessing) {
      return;
    }

    const handleCallback = async () => {
      hasProcessedRef.current = true;
      setIsProcessing(true);
      setStatus("processing");

      try {
        // Exchange the code for a session (Supabase handles this automatically via URL hash)
        // Instead of calling getSession(), wait for the auth state change event
        // The auth context will handle the session update via onAuthStateChange listener

        // Wait a bit for Supabase to process the hash and trigger auth state change
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Verify session exists
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error:", error);
          setStatus("error");
          setTimeout(() => {
            router.push("/login?error=confirmation_failed");
          }, 2000);
          return;
        }

        if (data.session) {
          // User is confirmed and logged in!
          setStatus("success");
          // Wait a bit more to ensure auth context has updated
          await new Promise((resolve) => setTimeout(resolve, 800));
          router.push("/shipments");
        } else {
          // No session yet, might need to wait for auth state change
          // Set up a one-time listener to wait for the session
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
              subscription.unsubscribe();
              setStatus("success");
              setTimeout(() => {
                router.push("/shipments");
              }, 800);
            }
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            if (!data.session) {
              setStatus("error");
              setTimeout(() => {
                router.push("/login?error=confirmation_timeout");
              }, 2000);
            }
          }, 5000);
        }
      } catch (error) {
        console.error("Unexpected error during callback:", error);
        setStatus("error");
        setTimeout(() => {
          router.push("/login?error=confirmation_failed");
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [router, isProcessing]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-gray-200 bg-white">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {status === "processing" && (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            )}
            {status === "error" && <Mail className="h-8 w-8 text-red-600" />}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {status === "processing" && "Confirming your email"}
              {status === "success" && "Email confirmed!"}
              {status === "error" && "Confirmation failed"}
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              {status === "processing" && (
                <span>Please wait while we verify your account...</span>
              )}
              {status === "success" && (
                <span className="text-green-600">
                  Your email has been verified successfully. Redirecting...
                </span>
              )}
              {status === "error" && (
                <span className="text-red-600">
                  There was an error verifying your email. Redirecting to
                  login...
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          {status === "processing" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
              </div>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                This usually takes just a few seconds
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
