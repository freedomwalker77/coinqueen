"use server";

import { findUserById, loadAllUserListings, loadUserMarket, saveUserMarket, updateUser } from "@/lib/db";
import { persistGhlAccount } from "@/lib/ghl";
import { listingBelongsOnShop } from "@/lib/market";
import { emptyMarket, mergeMarkets, type MarketState } from "@/lib/marketState";
import { getSessionUser } from "@/lib/session";

export async function getAccount() {
  return getSessionUser();
}

export async function loadAccountMarket(local: MarketState): Promise<MarketState | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const remote = loadUserMarket(user.id);
  const merged = mergeMarkets(local, remote);
  const persisted = findUserById(user.id);
  let wipedAt = persisted?.shopPostedClearedAt;
  if (!wipedAt) {
    wipedAt = new Date().toISOString();
    const saved = updateUser(user.id, { shopPostedClearedAt: wipedAt });
    if (saved) void persistGhlAccount(saved);
  }
  const next = {
    ...merged,
    listings: merged.listings.filter((row) => listingBelongsOnShop(row, user.shopSlug, wipedAt)),
    cart: merged.cart.filter((id) => {
      const listing = merged.listings.find((row) => row.id === id);
      return !listing || listingBelongsOnShop(listing, user.shopSlug, wipedAt);
    }),
  };
  saveUserMarket(user.id, next);
  return next;
}

export async function saveAccountMarket(state: MarketState) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  const wipedAt = findUserById(user.id)?.shopPostedClearedAt;
  const next = wipedAt
    ? {
        ...state,
        listings: state.listings.filter((row) => listingBelongsOnShop(row, user.shopSlug, wipedAt)),
      }
    : state;
  saveUserMarket(user.id, next);
  return { ok: true as const };
}

export async function requireAccountMarket() {
  const user = await getSessionUser();
  if (!user) return { user: null, market: emptyMarket };
  return { user, market: loadUserMarket(user.id) };
}

export async function getPublicListings() {
  return loadAllUserListings();
}
