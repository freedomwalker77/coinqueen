"use client";

import { ListingCard } from "./ListingCard";
import { useMarket } from "@/lib/localMarket";
import { SEED_LISTINGS } from "@/lib/market";
import type { Listing } from "@/lib/market";

export function MarketGrid({
  catalogId,
  shopSlug,
  limit,
}: {
  catalogId?: string;
  shopSlug?: string;
  limit?: number;
}) {
  const { ready, listings } = useMarket();
  const source: Listing[] = ready ? listings : SEED_LISTINGS;
  let rows = source;
  if (catalogId) rows = rows.filter((row) => row.catalogId === catalogId);
  if (shopSlug) rows = rows.filter((row) => row.shopSlug === shopSlug);
  if (limit) rows = rows.slice(0, limit);

  if (rows.length === 0) {
    return <p className="text-cream/55">No live listings in this slice yet.</p>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
