"use client";

import { AccountScreen, SignInGate } from "@/components/AccountScreen";
import { ListingCard } from "@/components/ListingCard";
import { useMarket } from "@/lib/localMarket";
import { isSampleListing } from "@/lib/market";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MyListingsBody() {
  const params = useSearchParams();
  const kind = params.get("kind");
  const { ready, account, listings } = useMarket();
  const mine = listings.filter(
    (row) => account && row.shopSlug === account.shopSlug && !isSampleListing(row),
  );
  const rows = kind === "auction" ? mine.filter((row) => row.kind === "auction") : mine;

  if (!ready) {
    return (
      <AccountScreen eyebrow="Selling" title="My listings" blurb="Your live shop lots.">
        <p className="text-cream/50">Loading…</p>
      </AccountScreen>
    );
  }
  if (!account) {
    return (
      <AccountScreen eyebrow="Selling" title="My listings" blurb="Your live shop lots.">
        <SignInGate />
      </AccountScreen>
    );
  }

  return (
    <AccountScreen
      eyebrow="Selling"
      title={kind === "auction" ? "My auctions" : "My listings"}
      blurb="Edit price, grade, and notes, or take a lot down. eBay listings already live stay on eBay until you end them there."
    >
      <div className="mb-6 flex gap-3 text-sm">
        <Link href="/listings" className="text-gold hover:underline">
          All
        </Link>
        <Link href="/listings?kind=auction" className="text-gold hover:underline">
          Auctions
        </Link>
        <Link href="/sell" className="text-gold hover:underline">
          New listing
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-cream/55">Nothing here yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </AccountScreen>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<p className="p-10 text-cream/50">Loading…</p>}>
      <MyListingsBody />
    </Suspense>
  );
}
