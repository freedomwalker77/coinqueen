"use client";

import { listOnEbay } from "@/app/actions/ebay";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { catalog, formatMoney, getItem } from "@/lib/catalog";
import { useMarket } from "@/lib/localMarket";
import type { ListingKind } from "@/lib/market";

export function SellForm({ ebayConnected = false }: { ebayConnected?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const preset = params.get("item") ?? catalog[0]?.id ?? "";
  const { publishListing, shopSlug, account, ready } = useMarket();
  const [catalogId, setCatalogId] = useState(preset);
  const [grade, setGrade] = useState("AU-50");
  const [price, setPrice] = useState("");
  const [kind, setKind] = useState<ListingKind>("buy_now");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [alsoEbay, setAlsoEbay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      onSubmit={async (event) => {
        event.preventDefault();
        const amount = Number(price);
        if (!catalogId || !Number.isFinite(amount) || amount <= 0) return;
        if (alsoEbay && !/^https:\/\//i.test(photoUrl.trim())) {
          setError("eBay needs a public https photo URL.");
          return;
        }
        if (alsoEbay && /imgur\.com/i.test(photoUrl) && !/\/\/i\.imgur\.com\//i.test(photoUrl)) {
          setError("Use the direct Imgur image: right-click the photo → Copy image address. It must start with https://i.imgur.com/");
          return;
        }
        setBusy(true);
        setError(null);
        const listingId = `user-${Date.now()}`;
        let ebayUrl: string | undefined;
        let ebayError: string | undefined;
        if (alsoEbay) {
          try {
            const result = await Promise.race([
              listOnEbay({
                listingId,
                catalogId,
                grade,
                price: amount,
                note,
                imageUrl: photoUrl,
              }),
              new Promise<{ error: string }>((resolve) => {
                setTimeout(() => resolve({ error: "eBay took too long. Your shop listing still published." }), 15_000);
              }),
            ]);
            if (result.error) ebayError = result.error;
            else ebayUrl = result.url;
          } catch {
            ebayError = "eBay took too long. Your shop listing still published.";
          }
        }
        const listing = publishListing({
          id: listingId,
          catalogId,
          grade,
          price: amount,
          kind,
          note,
          ebayUrl,
        });
        const qs = new URLSearchParams({ listed: listing.id });
        if (ebayUrl) qs.set("ebay", ebayUrl);
        if (ebayError) qs.set("ebay_error", ebayError);
        router.push(`/shop/${listing.shopSlug}?${qs.toString()}`);
      }}
    >
      <label className="block text-sm text-cream/70">
        Catalog piece
        <select
          value={catalogId}
          onChange={(event) => setCatalogId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
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
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
          />
        </label>
        <label className="text-sm text-cream/70">
          Price (USD)
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder={item ? String(item.marketMid) : "0"}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
          />
        </label>
      </div>
      <label className="block text-sm text-cream/70">
        Listing type
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as ListingKind)}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
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
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
          placeholder="Original surfaces, light hairlines, original envelope…"
        />
      </label>
      <label className="block text-sm text-cream/70">
        Photo URL (https) — required for eBay
        <input
          value={photoUrl}
          onChange={(event) => setPhotoUrl(event.target.value)}
          className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
          placeholder="https://i.imgur.com/….jpg"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-cream/80">
        <input
          type="checkbox"
          checked={alsoEbay}
          disabled={!ebayConnected}
          onChange={(event) => setAlsoEbay(event.target.checked)}
        />
        Also list on eBay (fixed price)
      </label>
      {!ebayConnected ? (
        <p className="text-sm text-cream/45">Sign in with eBay above to enable cross-posting.</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-gold px-6 py-3 font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-60"
      >
        {busy ? "Publishing…" : alsoEbay ? "Publish here and on eBay" : "Publish listing"}
      </button>
      <p className="text-sm text-cream/45">
        {ready && account
          ? `Publishes to ${shopSlug}. eBay uses your Seller Hub policies and location.`
          : "Sign in to publish into your account shop."}
      </p>
    </form>
  );
}
