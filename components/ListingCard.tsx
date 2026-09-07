"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/catalog";
import { getShop, isSampleListing, listingWithItem, type Listing } from "@/lib/market";
import { useMarket } from "@/lib/localMarket";
import { PieceArt } from "./PieceArt";

export function ListingCard({ listing }: { listing: Listing }) {
  const packed = listingWithItem(listing);
  const shop = getShop(listing.shopSlug);
  const { addToCart, placeBid, state } = useMarket();
  const [bid, setBid] = useState("");
  const [message, setMessage] = useState("");
  if (!packed) return null;
  const inCart = state.cart.includes(listing.id);

  return (
    <article className="overflow-hidden rounded-2xl border border-money/20 bg-queen shadow-sm">
      <Link href={`/item/${packed.item.id}`}>
        <PieceArt id={packed.item.id} className="h-36 w-full" />
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-money">
          <span>
            {isSampleListing(listing) ? "Sample" : listing.kind === "auction" ? "Auction" : "Buy now"}
          </span>
          <span className="text-cream/50">{listing.grade}</span>
        </div>
        <Link href={`/item/${packed.item.id}`} className="font-serif text-lg text-cream hover:text-gold">
          {packed.item.shortName}
        </Link>
        {shop ? (
          <Link href={`/shop/${shop.slug}`} className="block text-sm text-cream/55 hover:text-gold">
            {shop.name}
          </Link>
        ) : null}
        <p className="line-clamp-3 text-sm text-cream/60">{listing.note || packed.item.description}</p>
        <p className="text-xs text-cream/45">
          {listing.kind === "auction" ? "Auction" : "Buy now"} · {listing.grade}
          {listing.createdAt
            ? ` · listed ${new Date(listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : ""}
        </p>
        <p className="font-serif text-2xl text-gold">{formatMoney(listing.price)}</p>
        {isSampleListing(listing) ? (
          <p className="rounded-full border border-money/25 px-4 py-2 text-center text-sm text-cream/55">
            Sample lot · not for sale
          </p>
        ) : listing.kind === "auction" ? (
          <div className="space-y-2">
            <p className="text-xs text-cream/45">
              {listing.bids} bid{listing.bids === 1 ? "" : "s"}
              {listing.endsAt
                ? ` · ends ${new Date(listing.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : ""}
            </p>
            <div className="flex gap-2">
              <input
                value={bid}
                onChange={(event) => setBid(event.target.value)}
                placeholder={`> ${listing.price}`}
                className="w-full rounded-full border border-gold/25 bg-queen-deep px-3 py-1.5 text-sm text-cream"
              />
              <button
                type="button"
                onClick={() => {
                  const amount = Number(bid);
                  if (!Number.isFinite(amount) || amount <= listing.price) {
                    setMessage("Bid must beat the current price.");
                    return;
                  }
                  placeBid(listing.id, amount);
                  setBid("");
                  setMessage("Bid placed on this device.");
                }}
                className="shrink-0 rounded-full bg-gold px-3 py-1.5 text-sm font-medium text-queen-ink"
              >
                Bid
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              addToCart(listing.id);
              setMessage("Added to cart.");
            }}
            className="w-full rounded-full bg-gold px-4 py-2 font-medium text-queen-ink hover:bg-gold-bright"
          >
            {inCart ? "In cart" : "Add to cart"}
          </button>
        )}
        {message ? <p className="text-xs text-cream/50">{message}</p> : null}
      </div>
    </article>
  );
}
