"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { catalog, formatMoney, getItem } from "@/lib/catalog";
import { useMarket } from "@/lib/localMarket";
import type { ListingKind } from "@/lib/market";

export function SellForm() {
  const params = useSearchParams();
  const router = useRouter();
  const preset = params.get("item") ?? catalog[0]?.id ?? "";
  const { publishListing, shopSlug, account, ready } = useMarket();
  const [catalogId, setCatalogId] = useState(preset);
  const [grade, setGrade] = useState("AU-50");
  const [price, setPrice] = useState("");
  const [kind, setKind] = useState<ListingKind>("buy_now");
  const [note, setNote] = useState("");
  const item = useMemo(() => getItem(catalogId), [catalogId]);

  useEffect(() => {
    if (preset) setCatalogId(preset);
  }, [preset]);

  useEffect(() => {
    if (item) setPrice(String(item.marketMid));
  }, [item]);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const amount = Number(price);
        if (!catalogId || !Number.isFinite(amount) || amount <= 0) return;
        const listing = publishListing({ catalogId, grade, price: amount, kind, note });
        router.push(`/shop/${listing.shopSlug}?listed=${listing.id}`);
      }}
    >
      <label className="block text-sm text-cream/70">
        Catalog piece
        <select
          value={catalogId}
          onChange={(event) => setCatalogId(event.target.value)}
          className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
        >
          {catalog.map((piece) => (
            <option key={piece.id} value={piece.id}>
              {piece.name}
            </option>
          ))}
        </select>
      </label>
      {item ? (
        <p className="text-sm text-cream/50">
          Mid market {formatMoney(item.marketMid)} · range {formatMoney(item.marketLow)}–
          {formatMoney(item.marketHigh)}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-cream/70">
          Grade
          <input
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
          />
        </label>
        <label className="text-sm text-cream/70">
          Price (USD)
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder={item ? String(item.marketMid) : "0"}
            className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
          />
        </label>
      </div>
      <label className="block text-sm text-cream/70">
        Listing type
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as ListingKind)}
          className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
        >
          <option value="buy_now">Buy now</option>
          <option value="auction">Timed auction</option>
        </select>
      </label>
      <label className="block text-sm text-cream/70">
        Note (optional)
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
          placeholder="Original surfaces, light hairlines, original envelope…"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-gold px-6 py-3 font-medium text-queen-ink hover:bg-gold-bright"
      >
        Publish listing
      </button>
      <p className="text-sm text-cream/45">
        {ready && account
          ? `Publishes to ${shopSlug}. Stripe payouts are not wired yet.`
          : "Sign in to publish into your account shop."}
      </p>
    </form>
  );
}
