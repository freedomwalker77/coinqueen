"use client";

import { listOnEbay } from "@/app/actions/ebay";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { catalog, formatMoney, getItem } from "@/lib/catalog";
import { useMarket } from "@/lib/localMarket";
import type { ListingKind } from "@/lib/market";

export function SellForm({
  ebayConnected = false,
  ebaySubscribed = false,
}: {
  ebayConnected?: boolean;
  ebaySubscribed?: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const preset = params.get("item") ?? catalog[0]?.id ?? "";
  const editId = params.get("edit");
  const { publishListing, updateListing, listings, shopSlug, account, ready } = useMarket();
  const editing = listings.find((row) => row.id === editId && !row.seed);
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

  const hydratedEdit = useRef<string | null>(null);

  useEffect(() => {
    if (!editId) {
      hydratedEdit.current = null;
      if (preset) setCatalogId(preset);
      return;
    }
    if (hydratedEdit.current === editId) return;
    if (!editing) return;
    hydratedEdit.current = editId;
    setCatalogId(editing.catalogId);
    setGrade(editing.grade);
    setPrice(String(editing.price));
    setKind(editing.kind);
    setNote(editing.note ?? "");
    setPhotoUrl(editing.photoUrl ?? "");
  }, [preset, editId, editing]);

  useEffect(() => {
    if (item && !editing) setPrice(String(item.marketMid));
  }, [item, editing]);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const amount = Number(price);
        if (!catalogId || !Number.isFinite(amount) || amount <= 0) return;
        if (alsoEbay && !/^https:\/\//i.test(photoUrl.trim())) {
          setError("For eBay, publish from Scan and tap a similar listing photo. Your uploaded picture is fine for the shop.");
          return;
        }
        setBusy(true);
        setError(null);
        if (editing) {
          updateListing(editing.id, { catalogId, grade, price: amount, kind, note });
          router.push(`/shop/${shopSlug}?listed=${editing.id}`);
          return;
        }
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
                setTimeout(() => resolve({ error: "eBay took too long. Your shop listing still published." }), 20_000);
              }),
            ]);
            if ("error" in result && result.error) ebayError = result.error;
            else if ("url" in result) ebayUrl = result.url;
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
          photoUrl: photoUrl || undefined,
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
      {editing ? null : (
        <>
          <label className="block text-sm text-cream/70">
            Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setPhotoUrl(String(reader.result || ""));
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-24 w-24 rounded-xl object-cover" />
          ) : null}
          <p className="text-xs text-cream/45">
            Upload a picture for your shop. To also list on eBay, use Scan and tap a similar eBay photo — no
            Imgur.
          </p>
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input
              type="checkbox"
              checked={alsoEbay}
              disabled={!ebayConnected || !ebaySubscribed}
              onChange={(event) => setAlsoEbay(event.target.checked)}
            />
            Also list on eBay (fixed price)
          </label>
          {!ebayConnected ? (
            <p className="text-sm text-cream/45">Sign in with eBay above to enable cross-posting.</p>
          ) : !ebaySubscribed ? (
            <p className="text-sm text-cream/45">
              Subscribe above ($14.97/month) to unlock Also list on eBay.
            </p>
          ) : null}
        </>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-gold px-6 py-3 font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-60"
      >
        {busy ? "Saving…" : editing ? "Save listing" : alsoEbay ? "Publish here and on eBay" : "Publish listing"}
      </button>
      <p className="text-sm text-cream/45">
        {ready && account
          ? `Publishes to ${shopSlug}. eBay lists on your chosen site; worldwide shipping is in that site's Shipping policy.`
          : "Sign in to publish into your account shop."}
      </p>
    </form>
  );
}
