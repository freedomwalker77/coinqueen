import type { Comp } from "./catalog";

export const EBAY_SOLD = "eBay last sold";
export const HERITAGE = "Heritage Auctions";

export type SoldVenue = typeof EBAY_SOLD | typeof HERITAGE;

export type CompFeed = {
  rows: Comp[];
  mode: "sold" | "listed" | "sample";
  searchUrl: string;
};

/** MyVaultExchange prices from eBay completed sales and Heritage Auctions realized prices — not TCG. */
export const COMP_SOURCES = [EBAY_SOLD, HERITAGE] as const;

export function soldVenue(raw: string): SoldVenue {
  return /ebay/i.test(raw) ? EBAY_SOLD : HERITAGE;
}

export function isEbaySold(raw: string) {
  return soldVenue(raw) === EBAY_SOLD;
}
