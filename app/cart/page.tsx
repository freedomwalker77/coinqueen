"use client";

import { Footer, Header } from "@/components/Chrome";
import { formatMoney, getItem } from "@/lib/catalog";
import { liveListings, useMarket } from "@/lib/localMarket";
import { isSampleListing } from "@/lib/market";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { ready, state, removeFromCart, checkout } = useMarket();
  const [done, setDone] = useState<string | null>(null);
  const [stripeOn, setStripeOn] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listings = ready ? liveListings(state).filter((row) => state.cart.includes(row.id)) : [];
  const samples = listings.filter((row) => isSampleListing(row));
  const buyNow = listings.filter((row) => row.kind === "buy_now" && !isSampleListing(row));
  const auctions = listings.filter((row) => row.kind === "auction" && !isSampleListing(row));
  const total = buyNow.reduce((sum, row) => sum + row.price, 0);

  useEffect(() => {
    void fetch("/api/checkout")
      .then((res) => res.json() as Promise<{ enabled?: boolean }>)
      .then((json) => setStripeOn(Boolean(json.enabled)))
      .catch(() => setStripeOn(false));
  }, []);

  async function payWithStripe() {
    setPaying(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: buyNow.map((row) => row.id) }),
      });
      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) throw new Error(json.error || "Checkout failed");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setPaying(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">Cart</p>
        <h1 className="mt-2 font-serif text-4xl text-money">Checkout</h1>
        <p className="mt-2 max-w-2xl text-cream/60">
          {stripeOn
            ? "Pay buy-now lots with Stripe. Prices are in USD; cards from most countries work. Connected sellers receive the sale minus MyVaultExchange’s 10% fee."
            : "Stripe is off until you paste STRIPE_SECRET_KEY into .env.local in the project folder (same place as package.json), then restart npm run dev. Until then you can still record a demo order."}
        </p>
        {done ? (
          <p className="mt-8 rounded-2xl border border-gold/30 bg-queen-deep p-6 text-cream">
            Order {done} recorded.{" "}
            <Link href="/market" className="text-gold hover:underline">
              Back to market
            </Link>
          </p>
        ) : null}
        {listings.length === 0 && !done ? (
          <p className="mt-10 text-cream/55">
            Cart is empty.{" "}
            <Link href="/market" className="text-gold hover:underline">
              Browse listings
            </Link>
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {listings.map((listing) => {
              const item = getItem(listing.catalogId);
              return (
                <li
                  key={listing.id}
                  className="flex items-center justify-between rounded-2xl border border-gold/15 bg-queen-deep px-4 py-3"
                >
                  <div>
                    <p className="text-cream">{item?.shortName ?? listing.catalogId}</p>
                    <p className="text-sm text-cream/50">
                      {listing.grade} ·{" "}
                      {isSampleListing(listing)
                        ? "Sample · not for sale"
                        : listing.kind === "auction"
                          ? "Auction (bid on the listing)"
                          : "Buy now"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-gold">{formatMoney(listing.price)}</p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(listing.id)}
                      className="text-sm text-cream/45 hover:text-cream"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {samples.length > 0 ? (
          <p className="mt-4 text-sm text-cream/50">
            Sample catalog lots are display-only and cannot be purchased. Remove them or leave them — they
            are not included in Stripe checkout.
          </p>
        ) : null}
        {auctions.length > 0 ? (
          <p className="mt-4 text-sm text-cream/50">
            Auction lots stay in the cart until you remove them — bid on the market card instead of
            checking out.
          </p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {buyNow.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gold/15 pt-6">
            <p className="font-serif text-2xl text-money">Total {formatMoney(total)}</p>
            <div className="flex flex-wrap gap-2">
              {stripeOn ? (
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => void payWithStripe()}
                  className="rounded-full bg-gold px-6 py-3 font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-50"
                >
                  {paying ? "Redirecting to Stripe…" : "Pay with Stripe"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const order = checkout();
                    if (order) setDone(order.id);
                  }}
                  className="rounded-full bg-gold px-6 py-3 font-medium text-queen-ink hover:bg-gold-bright"
                >
                  Complete demo order
                </button>
              )}
            </div>
          </div>
        ) : null}
        {ready && state.orders.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-money">Past orders</h2>
            <ul className="mt-4 space-y-2 text-sm text-cream/60">
              {state.orders.map((order) => (
                <li key={order.id}>
                  {order.id} · {formatMoney(order.total)} ·{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
