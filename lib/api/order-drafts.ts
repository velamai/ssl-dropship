import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { OrderDraft, OrderDraftItem } from "@/lib/order-draft";

const supabase = getSupabaseBrowserClient();

function toDbDraft(draft: OrderDraft, userId: string) {
  const now = new Date().toISOString();
  return {
    id: draft.id,
    user_id: userId,
    name: draft.name,
    saved_at: draft.savedAt,
    service_type: draft.serviceType,
    source_country_code: draft.sourceCountryCode,
    destination_country_code: draft.destinationCountryCode ?? null,
    purchased_date: draft.purchasedDate ?? null,
    purchased_site: draft.purchasedSite ?? null,
    invoice_urls: draft.invoiceUrls ?? null,
    product_image_urls: draft.productImageUrls ?? null,
    updated_at: now,
  };
}

function toDbItem(item: OrderDraftItem, draftId: string, sortOrder: number) {
  return {
    draft_id: draftId,
    product_url: item.productUrl,
    product_name: item.productName,
    product_note: item.productNote ?? null,
    price: item.price,
    value_currency: item.valueCurrency,
    quantity: item.quantity,
    sort_order: sortOrder,
  };
}

function fromDbDraft(row: Record<string, unknown>): OrderDraft {
  const items = (row.items as Record<string, unknown>[]) || [];
  return {
    id: row.id as string,
    name: row.name as string,
    savedAt: row.saved_at as string,
    serviceType: row.service_type as "link" | "warehouse",
    sourceCountryCode: row.source_country_code as string,
    destinationCountryCode: (row.destination_country_code as string) || undefined,
    items: items.map((i) => ({
      productUrl: i.product_url as string,
      productName: i.product_name as string,
      productNote: (i.product_note as string) || undefined,
      price: Number(i.price),
      valueCurrency: i.value_currency as string,
      quantity: Number(i.quantity),
    })),
    purchasedDate: (row.purchased_date as string) || undefined,
    purchasedSite: (row.purchased_site as string) || undefined,
    invoiceUrls: (row.invoice_urls as string[]) || undefined,
    productImageUrls: (row.product_image_urls as string[]) || undefined,
  };
}

/**
 * Save draft to database (upsert). Used when user is logged in.
 */
export async function saveDraftToDb(
  draft: OrderDraft,
  userId: string
): Promise<void> {
  const dbDraft = toDbDraft(draft, userId);

  const { error: draftError } = await supabase.from("order_drafts").upsert(
    dbDraft,
    { onConflict: "id" }
  );

  if (draftError) {
    console.error("Error saving draft to DB:", draftError);
    throw draftError;
  }

  // Delete existing items and re-insert (simplest upsert for items)
  await supabase
    .from("order_draft_items")
    .delete()
    .eq("draft_id", draft.id);

  const validItems = draft.items.filter((i) => i.productUrl?.trim());
  if (validItems.length > 0) {
    const dbItems = validItems.map((item, idx) =>
      toDbItem(item, draft.id, idx)
    );

    const { error: itemsError } = await supabase
      .from("order_draft_items")
      .insert(dbItems);

    if (itemsError) {
      console.error("Error saving draft items to DB:", itemsError);
      throw itemsError;
    }
  }
}

/**
 * Fetch user's drafts from database.
 */
export async function getDraftsFromDb(
  userId: string
): Promise<OrderDraft[]> {
  const { data: drafts, error: draftsError } = await supabase
    .from("order_drafts")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (draftsError) {
    console.error("Error fetching drafts from DB:", draftsError);
    throw draftsError;
  }

  if (!drafts || drafts.length === 0) return [];

  const draftIds = drafts.map((d) => d.id);

  const { data: items, error: itemsError } = await supabase
    .from("order_draft_items")
    .select("*")
    .in("draft_id", draftIds)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error("Error fetching draft items from DB:", itemsError);
    throw itemsError;
  }

  const itemsByDraftId = new Map<string, Record<string, unknown>[]>();
  for (const item of items || []) {
    const draftId = item.draft_id as string;
    if (!itemsByDraftId.has(draftId)) {
      itemsByDraftId.set(draftId, []);
    }
    itemsByDraftId.get(draftId)!.push(item);
  }

  return drafts.map((d) =>
    fromDbDraft({ ...d, items: itemsByDraftId.get(d.id) || [] })
  );
}

/**
 * Delete draft from database. Used when user deletes draft or places order.
 */
export async function deleteDraftFromDb(
  draftId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("order_drafts")
    .delete()
    .eq("id", draftId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting draft from DB:", error);
    throw error;
  }
}
