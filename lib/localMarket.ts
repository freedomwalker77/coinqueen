"use client";

import { useEffect, useState } from "react";
import { getAccount, loadAccountMarket, saveAccountMarket } from "@/app/actions/market";
import type { SessionUser } from "@/lib/definitions";
import { MY_SHOP, type Listing, type ListingKind } from "./market";
import {
  emptyMarket,
  liveListings,
  type CollectionItem,
  type MarketState,
  type Order,
} from "./marketState";

const KEY = "myvaultexchange-market-v1";
const EVENT = "myvaultexchange-market";

export type { CollectionItem, MarketState, Order };

function load(): MarketState {
  if (typeof window === "undefined") return emptyMarket;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyMarket;
    return { ...emptyMarket, ...JSON.parse(raw) } as MarketState;
  } catch {
    return emptyMarket;
  }
}

function persist(next: MarketState) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export { liveListings };

export function useMarket() {
  const [state, setState] = useState<MarketState>(emptyMarket);
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const local = load();
      const user = await getAccount();
      if (cancelled) return;
      setAccount(user);
      if (user) {
        const merged = await loadAccountMarket(local);
        if (cancelled) return;
        const next = merged ?? local;
        persist(next);
        setState(next);
      } else {
        setState(local);
      }
      setReady(true);
    }
    void boot();
    const refresh = () => setState(load());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function update(mutator: (prev: MarketState) => MarketState) {
    const next = mutator(load());
    persist(next);
    setState(next);
    if (account) void saveAccountMarket(next);
  }

  const listings = liveListings(state);
  const shopSlug = account?.shopSlug ?? MY_SHOP.slug;

  function addToCollection(catalogId: string, grade = "Raw") {
    update((prev) => ({
      ...prev,
      collection: [
        {
          id: `col-${Date.now()}`,
          catalogId,
          grade,
          addedAt: new Date().toISOString(),
        },
        ...prev.collection,
      ],
    }));
  }

  function removeFromCollection(id: string) {
    update((prev) => ({ ...prev, collection: prev.collection.filter((row) => row.id !== id) }));
  }

  function publishListing(input: {
    catalogId: string;
    grade: string;
    price: number;
    kind: ListingKind;
    note?: string;
    days?: number;
  }) {
    const ends = new Date();
    ends.setDate(ends.getDate() + (input.days ?? 3));
    const listing: Listing = {
      id: `user-${Date.now()}`,
      catalogId: input.catalogId,
      shopSlug,
      grade: input.grade,
      price: input.price,
      kind: input.kind,
      endsAt: input.kind === "auction" ? ends.toISOString() : undefined,
      bids: 0,
      note: input.note,
      createdAt: new Date().toISOString(),
      seed: false,
    };
    update((prev) => ({ ...prev, listings: [listing, ...prev.listings] }));
    return listing;
  }

  function addToCart(listingId: string) {
    update((prev) => ({
      ...prev,
      cart: prev.cart.includes(listingId) ? prev.cart : [...prev.cart, listingId],
    }));
  }

  function removeFromCart(listingId: string) {
    update((prev) => ({ ...prev, cart: prev.cart.filter((id) => id !== listingId) }));
  }

  function placeBid(listingId: string, amount: number) {
    update((prev) => {
      const current = liveListings(prev).find((row) => row.id === listingId);
      if (!current || current.kind !== "auction" || amount <= current.price) return prev;
      if (current.seed) {
        return {
          ...prev,
          bids: { ...prev.bids, [listingId]: { amount, count: current.bids + 1 } },
        };
      }
      return {
        ...prev,
        listings: prev.listings.map((row) =>
          row.id === listingId ? { ...row, price: amount, bids: row.bids + 1 } : row,
        ),
      };
    });
  }

  function checkout(listingIds?: string[]) {
    const prev = load();
    const wanted = new Set(listingIds ?? prev.cart);
    const lines = liveListings(prev).filter(
      (row) => wanted.has(row.id) && row.kind === "buy_now",
    );
    if (lines.length === 0) return null;
    const total = lines.reduce((sum, row) => sum + row.price, 0);
    const order: Order = {
      id: `ord-${Date.now()}`,
      listingIds: lines.map((row) => row.id),
      total,
      createdAt: new Date().toISOString(),
    };
    const ids = new Set(order.listingIds);
    const next = {
      ...prev,
      cart: prev.cart.filter((id) => !ids.has(id)),
      soldSeedIds: [...prev.soldSeedIds, ...order.listingIds.filter((id) => id.startsWith("seed-"))],
      listings: prev.listings.filter((row) => !ids.has(row.id)),
      orders: [order, ...prev.orders],
    };
    persist(next);
    setState(next);
    if (account) void saveAccountMarket(next);
    return order;
  }

  const inCollection = (catalogId: string) =>
    state.collection.some((row) => row.catalogId === catalogId);

  return {
    ready,
    account,
    state,
    listings,
    shopSlug,
    addToCollection,
    removeFromCollection,
    publishListing,
    addToCart,
    removeFromCart,
    placeBid,
    checkout,
    inCollection,
  };
}
