"use client";

import { AccountScreen, SignInGate } from "@/components/AccountScreen";
import { formatMoney } from "@/lib/catalog";
import { useMarket } from "@/lib/localMarket";
import { isSampleListing } from "@/lib/market";
import Link from "next/link";

export default function AccountPage() {
  const { ready, account, listings, state } = useMarket();
  const mine = listings.filter(
    (row) => account && row.shopSlug === account.shopSlug && !isSampleListing(row),
  );

  if (!ready) {
    return (
      <AccountScreen eyebrow="Account" title="Dashboard" blurb="Your shop at a glance.">
        <p className="text-cream/50">Loading…</p>
      </AccountScreen>
    );
  }
  if (!account) {
    return (
      <AccountScreen eyebrow="Account" title="Dashboard" blurb="Your shop at a glance.">
        <SignInGate />
      </AccountScreen>
    );
  }

  return (
    <AccountScreen
      eyebrow="Account"
      title="Seller dashboard"
      blurb="Listings, payouts, and eBay tools for your MyVaultExchange shop."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-money/20 bg-queen-deep p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Live lots</p>
          <p className="mt-2 font-serif text-3xl text-money">{mine.length}</p>
        </div>
        <div className="rounded-2xl border border-money/20 bg-queen-deep p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Orders</p>
          <p className="mt-2 font-serif text-3xl text-money">{state.orders.length}</p>
        </div>
        <div className="rounded-2xl border border-money/20 bg-queen-deep p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Collection</p>
          <p className="mt-2 font-serif text-3xl text-money">{state.collection.length}</p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/sell" className="rounded-full bg-gold px-4 py-2 font-medium text-queen-ink">
          New listing
        </Link>
        <Link href="/listings" className="rounded-full border border-money/25 px-4 py-2 text-cream">
          My listings
        </Link>
        <Link href={`/shop/${account.shopSlug}`} className="rounded-full border border-money/25 px-4 py-2 text-cream">
          My store
        </Link>
      </div>
      {state.orders[0] ? (
        <p className="mt-8 text-sm text-cream/55">
          Latest order {state.orders[0].id} · {formatMoney(state.orders[0].total)}
        </p>
      ) : null}
    </AccountScreen>
  );
}
