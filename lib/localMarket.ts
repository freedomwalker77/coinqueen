"use client";

import { useEffect, useState } from "react";
import { MY_SHOP, SEED_LISTINGS, type Listing, type ListingKind } from "./market";

const KEY = "coinqueen-market-v1";
const EVENT = "coinqueen-market";

export type CollectionItem = {
  id: string;
  catalogId: string;
  grade: string;
  addedAt: string;
};

export type Order = {
  id: string;
  listingIds: string[];
  total: number;
  createdAt: string;
};

export type MarketState = {
  listings: Listing[];
  soldSeedIds: string[];
  collection: CollectionItem[];
  cart: string[];
  orders: Order[];
  bids: Record<string, { amount: number; count: number }>;
};

const empty: MarketState = {
  listings: [],
  soldSeedIds: [],
  collection: [],
  cart: [],
  orders: [],
  bids: {},
};

function load(): MarketState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) } as MarketState;
  } catch {
    return empty;
  }
}

function persist(next: MarketState) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function liveListings(state: MarketState): Listing[] {
  const sold = new Set(state.soldSeedIds);
  const seed = SEED_LISTINGS.filter((row) => !sold.has(row.id)).map((row) => {
    const overlay = state.bids[row.id];
    if (!overlay) return row;
    return { ...row, price: overlay.amount, bids: overlay.count };
  });
  return [...state.listings, ...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function useMarket() {
  const [state, setState] = useState<MarketState>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setState(load());
    refresh();
    setReady(true);
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function update(mutator: (prev: MarketState) => MarketState) {
    const next = mutator(load());
    persist(next);
    setState(next);
  }

  const listings = liveListings(state);

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
      shopSlug: MY_SHOP.slug,
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

  function checkout() {
    const prev = load();
    const lines = liveListings(prev).filter(
      (row) => prev.cart.includes(row.id) && row.kind === "buy_now",
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
    persist({
      ...prev,
      cart: prev.cart.filter((id) => !ids.has(id)),
      soldSeedIds: [...prev.soldSeedIds, ...order.listingIds.filter((id) => id.startsWith("seed-"))],
      listings: prev.listings.filter((row) => !ids.has(row.id)),
      orders: [order, ...prev.orders],
    });
    setState(load());
    return order;
  }

  const inCollection = (catalogId: string) =>
    state.collection.some((row) => row.catalogId === catalogId);

  return {
    ready,
    state,
    listings,
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
