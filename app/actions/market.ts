"use server";

import { loadAllUserListings, loadUserMarket, saveUserMarket } from "@/lib/db";
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
  saveUserMarket(user.id, merged);
  return merged;
}

export async function saveAccountMarket(state: MarketState) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  saveUserMarket(user.id, state);
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
