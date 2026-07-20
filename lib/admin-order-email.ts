import { getSupabaseBrowserClient } from "@/lib/supabase";

export const ADMIN_ORDER_PLATFORM_NAME = "Buy2Send";

export async function sendAdminOrderNotificationEmail(
  shipmentId: string | number,
  platformName: string = ADMIN_ORDER_PLATFORM_NAME,
) {
  const sendEmailUrl = process.env.NEXT_PUBLIC_SEND_EMAIL_FUNCTION_URL;

  if (!sendEmailUrl) {
    throw new Error("NEXT_PUBLIC_SEND_EMAIL_FUNCTION_URL is missing");
  }

  const supabase = getSupabaseBrowserClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User must be logged in to send admin notification");
  }

  const response = await fetch(sendEmailUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({
      shipmentId: String(shipmentId),
      PLATFORM_NAME: platformName,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Failed to send admin notification email");
  }

  return data;
}
