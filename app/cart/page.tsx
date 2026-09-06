"use client";

import { Footer, Header } from "@/components/Chrome";
import { formatMoney, getItem } from "@/lib/catalog";
import { liveListings, useMarket } from "@/lib/localMarket";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { ready, state, removeFromCart, checkout } = useMarket();
  const [done, setDone] = useState<string | null>(null);
  const listings = ready ? liveListings(state).filter((row) => state.cart.includes(row.id)) : [];
  const buyNow = listings.filter((row) => row.kind === "buy_now");
  const auctions = listings.filter((row) => row.kind === "auction");
  const total = buyNow.reduce((sum, row) => sum + row.price, 0);

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Cart</p>
        <h1 className="mt-2 font-serif text-4xl text-cream">Checkout demo</h1>
        <p className="mt-2 max-w-2xl text-cream/60">
          No Stripe yet. Completing an order marks buy-now listings sold on this device.
        </p>
        {done ? (
          <p className="mt-8 rounded-2xl border border-gold/30 bg-queen-card p-6 text-cream">
            Order {done} recorded locally.{" "}
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
                  className="flex items-center justify-between rounded-2xl border border-gold/15 bg-queen-card px-4 py-3"
                >
                  <div>
                    <p className="text-cream">{item?.shortName ?? listing.catalogId}</p>
                    <p className="text-sm text-cream/50">
                      {listing.grade} · {listing.kind === "auction" ? "Auction (bid on the listing)" : "Buy now"}
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
        {auctions.length > 0 ? (
          <p className="mt-4 text-sm text-cream/50">
            Auction lots stay in the cart until you remove them — bid on the market card instead of
            checking out.
          </p>
        ) : null}
        {buyNow.length > 0 ? (
          <div className="mt-8 flex items-center justify-between border-t border-gold/15 pt-6">
            <p className="font-serif text-2xl text-cream">Total {formatMoney(total)}</p>
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
          </div>
        ) : null}
        {ready && state.orders.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-cream">Past demo orders</h2>
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
