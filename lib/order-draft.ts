/**
 * Order draft / cart storage utilities
 * Uses localStorage for guest and logged-in users (no login required to save)
 */

import type { OrderFormData } from "@/lib/schemas/shipmentSchema";

const STORAGE_KEY = "order-drafts";
const PENDING_CHECKOUT_KEY = "pending-checkout-draft";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface OrderDraftItem {
  productUrl: string;
  productName: string;
  productNote?: string;
  price: number;
  valueCurrency: string;
  quantity: number;
}

export interface OrderDraft {
  id: string;
  name: string;
  savedAt: string;
  serviceType: "link" | "warehouse";
  sourceCountryCode: string;
  destinationCountryCode?: string;
  items: OrderDraftItem[];
  purchasedDate?: string;
  purchasedSite?: string;
  invoiceUrls?: string[];
  productImageUrls?: string[];
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getDrafts(): OrderDraft[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft: OrderDraft): void {
  if (!isClient()) return;
  const drafts = getDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  const updated = idx >= 0
    ? drafts.map((d, i) => (i === idx ? draft : d))
    : [...drafts, draft];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function addDraft(draft: OrderDraft): void {
  if (!isClient()) return;
  const drafts = getDrafts();
  drafts.push(draft);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function updateDraft(id: string, updates: Partial<OrderDraft>): void {
  if (!isClient()) return;
  const drafts = getDrafts();
  const idx = drafts.findIndex((d) => d.id === id);
  if (idx < 0) return;
  drafts[idx] = { ...drafts[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function deleteDraft(id: string): void {
  if (!isClient()) return;
  const drafts = getDrafts().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function getDraftById(id: string): OrderDraft | null {
  return getDrafts().find((d) => d.id === id) ?? null;
}

/**
 * Replace all drafts in localStorage. Used when syncing from DB.
 */
export function setDraftsInStorage(drafts: OrderDraft[]): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

/**
 * Append a single item to the most recent draft, or create a new draft if none exist.
 */
export function addItemToLatestDraft(item: OrderDraftItem, sourceCountryCode: string, destinationCountryCode?: string): OrderDraft {
  const drafts = getDrafts();
  const latest = drafts[drafts.length - 1];

  if (latest && latest.sourceCountryCode === sourceCountryCode) {
    const updated: OrderDraft = {
      ...latest,
      items: [...latest.items, item],
      savedAt: new Date().toISOString(),
    };
    if (destinationCountryCode) updated.destinationCountryCode = destinationCountryCode;
    updateDraft(latest.id, updated);
    return updated;
  }

  const newDraft: OrderDraft = {
    id: generateUUID(),
    name: `Draft ${drafts.length + 1}`,
    savedAt: new Date().toISOString(),
    serviceType: "link",
    sourceCountryCode,
    destinationCountryCode,
    items: [item],
  };
  addDraft(newDraft);
  return newDraft;
}

/**
 * Convert draft to form values for prefill
 */
export function draftToFormValues(draft: OrderDraft): Partial<OrderFormData> {
  const items = draft.items.map((item) => ({
    uuid: generateUUID(),
    productUrl: item.productUrl,
    productName: item.productName,
    productNote: item.productNote || "",
    price: item.price,
    valueCurrency: item.valueCurrency,
    quantity: item.quantity,
  }));

  return {
    shipments: [
      {
        shipmentType: draft.serviceType,
        country: draft.destinationCountryCode || "",
        sourceCountryCode: draft.sourceCountryCode,
        warehouseId: undefined,
        purchasedDate: draft.purchasedDate ? new Date(draft.purchasedDate) : undefined,
        purchasedSite: draft.purchasedSite || undefined,
        packageType: "box",
        dimensions: { length: undefined, width: undefined, height: undefined },
        isPickupNeeded: false,
        pickup: {
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
          addressLine4: "",
          postalCode: "",
          date: undefined,
          phoneNumber: "",
          phoneCode: "",
          instructions: "",
        },
        receiver: {
          firstName: "",
          lastName: "",
          company: "",
          vatTax: "",
          phone: "",
          phoneCode: "",
          email: "",
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
          addressLine4: "",
          postalCode: "",
          receivingCountry: draft.destinationCountryCode || "",
        },
        items,
        invoiceUrls: draft.invoiceUrls,
        productImageUrls: draft.productImageUrls,
        notes: "",
      },
    ],
  };
}

/**
 * Convert form values to draft (for Save Draft from create-shipments)
 */
export function formValuesToDraft(
  shipment: NonNullable<OrderFormData["shipments"]>[0],
  draftId?: string,
  name?: string
): OrderDraft {
  const items: OrderDraftItem[] = (shipment.items || [])
    .filter((item) => item.productUrl?.trim())
    .map((item) => ({
      productUrl: item.productUrl,
      productName: item.productName || "Product",
      productNote: item.productNote,
      price: item.price ?? 0,
      valueCurrency: item.valueCurrency || "INR",
      quantity: item.quantity ?? 1,
    }));

  return {
    id: draftId || generateUUID(),
    name: name || `Draft from ${new Date().toLocaleDateString()}`,
    savedAt: new Date().toISOString(),
    serviceType: (shipment.shipmentType as "link" | "warehouse") || "link",
    sourceCountryCode: shipment.sourceCountryCode || "",
    destinationCountryCode: shipment.receiver?.receivingCountry,
    items,
    purchasedDate: shipment.purchasedDate
      ? (typeof shipment.purchasedDate === "string"
          ? shipment.purchasedDate
          : shipment.purchasedDate.toISOString?.())
      : undefined,
    purchasedSite: shipment.purchasedSite,
    invoiceUrls: shipment.invoiceUrls,
    productImageUrls: shipment.productImageUrls,
  };
}

// Pending checkout (for login redirect flow)
export function savePendingCheckoutDraft(formData: OrderFormData): void {
  if (!isClient()) return;
  const shipment = formData.shipments?.[0];
  if (!shipment) return;
  const draft = formValuesToDraft(shipment, "pending-checkout", "Pending checkout");
  localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(draft));
}

export function getPendingCheckoutDraft(): OrderDraft | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingCheckoutDraft(): void {
  if (!isClient()) return;
  localStorage.removeItem(PENDING_CHECKOUT_KEY);
}
