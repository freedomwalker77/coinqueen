"use server";

import { resolvePersistedUser } from "@/lib/account";
import { isAdminEmail } from "@/lib/admin";
import { refreshEbayPlan } from "@/lib/ebayPlan";
import { EBAY_SELL_SITES, isEbaySellSite } from "@/lib/ebayMarketplaces";
import { defaultEbayMarketplace, ebaySellConfigured, publishToEbay } from "@/lib/ebaySell";
import { getItem } from "@/lib/catalog";
import { updateUser } from "@/lib/db";
import { persistGhlAccount } from "@/lib/ghl";
import { getSessionUser } from "@/lib/session";

export async function getEbayStatus() {
  const session = await getSessionUser();
  const user = session ? await resolvePersistedUser(session) : null;
  const plan = user
    ? await refreshEbayPlan(user)
    : {
        enabled: false,
        subscribed: false,
        status: null as string | null,
        periodEnd: null as number | null,
        admin: false,
      };
  const admin = Boolean(plan.admin) || isAdminEmail(session?.email);
  return {
    configured: ebaySellConfigured(),
    connected: Boolean(user?.ebayRefreshToken),
    subscribed: plan.subscribed || admin,
    admin,
    planEnabled: plan.enabled,
    planStatus: plan.status,
    planPeriodEnd: plan.periodEnd,
    marketplace:
      user?.ebayMarketplace && isEbaySellSite(user.ebayMarketplace)
        ? user.ebayMarketplace
        : defaultEbayMarketplace(),
    sites: EBAY_SELL_SITES.map((site) => ({ id: site.id, label: site.label })),
  };
}

export async function saveEbayMarketplace(marketplace: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." as const };
  if (!isEbaySellSite(marketplace)) return { error: "Unknown eBay site." as const };
  const user = await resolvePersistedUser(session, { skipRemoteIfEbay: true });
  if (!user) return { error: "Account not found. Log out and log in, then try again." as const };
  const saved = updateUser(user.id, { ebayMarketplace: marketplace });
  if (saved) void persistGhlAccount(saved);
  return { marketplace };
}

export async function listOnEbay(input: {
  listingId: string;
  catalogId: string;
  grade: string;
  price: number;
  note?: string;
  imageUrl: string;
  marketplace?: string;
}): Promise<{ url?: string; error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." };
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found. Log out and log in, then try again." };
  if (!user.ebayRefreshToken) return { error: "Connect eBay on this page first." };
  const plan = await refreshEbayPlan(user);
  if (!plan.subscribed) {
    return { error: "Subscribe to Also list on eBay ($14.97/month) on this page first." };
  }
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
    marketplace: input.marketplace,
  });
}
