import { SEED_LISTINGS, type Listing } from "./market";

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

export const emptyMarket: MarketState = {
  listings: [],
  soldSeedIds: [],
  collection: [],
  cart: [],
  orders: [],
  bids: {},
};

export function liveListings(state: MarketState): Listing[] {
  const sold = new Set(state.soldSeedIds);
  const seed = SEED_LISTINGS.filter((row) => !sold.has(row.id)).map((row) => {
    const overlay = state.bids[row.id];
    if (!overlay) return row;
    return { ...row, price: overlay.amount, bids: overlay.count };
  });
  return [...state.listings, ...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function uniqById<T extends { id: string }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export function mergeMarkets(local: MarketState, remote: MarketState): MarketState {
  return {
    listings: uniqById([...remote.listings, ...local.listings]),
    collection: uniqById([...remote.collection, ...local.collection]),
    cart: [...new Set([...remote.cart, ...local.cart])],
    orders: uniqById([...remote.orders, ...local.orders]),
    soldSeedIds: [...new Set([...remote.soldSeedIds, ...local.soldSeedIds])],
    bids: { ...local.bids, ...remote.bids },
  };
}
