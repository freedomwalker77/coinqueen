"use client";

import { getPublicListings } from "@/app/actions/market";
import { useMarket } from "@/lib/localMarket";
import { SEED_LISTINGS, type Listing } from "@/lib/market";
import { useEffect, useState } from "react";
import { ListingCard } from "./ListingCard";

export function MarketGrid({
  catalogId,
  shopSlug,
  limit,
  compact,
}: {
  catalogId?: string;
  shopSlug?: string;
  limit?: number;
  compact?: boolean;
}) {
  const { ready, listings } = useMarket();
  const [publicListings, setPublicListings] = useState<Listing[]>([]);

  useEffect(() => {
    void getPublicListings().then(setPublicListings);
  }, []);

  const seen = new Set<string>();
  const source: Listing[] = [];
  for (const row of [...(ready ? listings : SEED_LISTINGS), ...publicListings]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    source.push(row);
  }
  source.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  let rows = source;
  if (catalogId) rows = rows.filter((row) => row.catalogId === catalogId);
  if (shopSlug) rows = rows.filter((row) => row.shopSlug === shopSlug);
  if (limit) rows = rows.slice(0, limit);

  if (rows.length === 0) {
    return <p className="text-cream/55">No live listings in this slice yet.</p>;
  }

  return (
    <div className={compact ? "grid gap-4" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
      {rows.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
