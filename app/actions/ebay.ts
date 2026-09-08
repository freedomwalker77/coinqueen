"use server";

import { resolvePersistedUser } from "@/lib/account";
import { ebaySellConfigured, publishToEbay } from "@/lib/ebaySell";
import { getItem } from "@/lib/catalog";
import { getSessionUser } from "@/lib/session";

export async function getEbayStatus() {
  const session = await getSessionUser();
  const user = session ? await resolvePersistedUser(session) : null;
  return {
    configured: ebaySellConfigured(),
    connected: Boolean(user?.ebayRefreshToken),
  };
}

export async function listOnEbay(input: {
  listingId: string;
  catalogId: string;
  grade: string;
  price: number;
  note?: string;
  imageUrl: string;
}): Promise<{ url?: string; error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." };
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found. Log out and log in, then try again." };
  if (!user.ebayRefreshToken) return { error: "Connect eBay on this page first." };
  const item = getItem(input.catalogId);
  if (!item) return { error: "Unknown catalog piece." };
  if (!Number.isFinite(input.price) || input.price <= 0) return { error: "Need a valid price." };
  return publishToEbay({
    user,
    sku: input.listingId,
    item,
    grade: input.grade,
    price: input.price,
    note: input.note,
    imageUrl: input.imageUrl,
  });
}
