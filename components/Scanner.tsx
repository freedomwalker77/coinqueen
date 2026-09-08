"use client";

import { useState } from "react";
import Link from "next/link";
import { catalog, formatMoney, type CatalogItem } from "@/lib/catalog";
import type { CompFeed } from "@/lib/comps";
import { EBAY_SOLD, HERITAGE } from "@/lib/comps";
import { SoldColumn } from "@/components/SoldColumn";
import { MarketGrid } from "@/components/MarketGrid";
import { PieceArt } from "@/components/PieceArt";
import { listingPhotoSrc } from "@/lib/ebayImage";
import { useMarket } from "@/lib/localMarket";

type MatchRow = {
  item: CatalogItem;
  score: number;
  reasons: string[];
  ebay?: CompFeed;
  heritage?: CompFeed;
  forSale?: CompFeed;
};

type IdentifyResponse = {
  matches: MatchRow[];
  vision: Record<string, string> | null;
  usedAi: boolean;
  message?: string;
};

const SAMPLES = [
  { id: "1881-s-morgan-dollar", label: "Morgan dollar" },
  { id: "1935a-silver-certificate", label: "Silver certificate" },
  { id: "1900-gold-sovereign", label: "Gold sovereign" },
  { id: "hadrian-denarius", label: "Roman denarius" },
];

async function prepareScanFile(file: File): Promise<File> {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg" || type === "image/png" || type === "image/webp") return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that photo. Try taking it again as JPEG."));
      el.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height) || 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) return file;
    return new File([blob], "scan.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function Scanner({
  photoIdReady = false,
  ebayReady = false,
}: {
  photoIdReady?: boolean;
  ebayReady?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const { addToCollection } = useMarket();
  const [hints, setHints] = useState({
    year: "",
    country: "",
    denomination: "",
    type: "" as "" | "coin" | "note",
  });

  async function identify(extra?: { sampleId?: string; image?: File }) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      const image = extra?.image ?? file;
      if (image) body.set("image", image);
      body.set("year", hints.year);
      body.set("country", hints.country);
      body.set("denomination", hints.denomination);
      body.set("type", hints.type);
      if (extra?.sampleId) body.set("sampleId", extra.sampleId);
      const response = await fetch("/api/identify", { method: "POST", body });
      const json = (await response.json()) as IdentifyResponse & { error?: string };
      if (!response.ok) throw new Error(json.error || "Identify failed");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identify failed");
    } finally {
      setBusy(false);
    }
  }

  function loadSample(id: string) {
    const item = catalog.find((piece) => piece.id === id);
    if (!item) return;
    setPreview(null);
    setFile(null);
    setHints({
      year: item.year ? String(item.year) : "",
      country: item.country,
      denomination: item.denomination,
      type: item.type,
    });
    void identify({ sampleId: id });
  }

  async function applyPhoto(next: File) {
    try {
      const ready = await prepareScanFile(next);
      setFile(ready);
      setPreview(URL.createObjectURL(ready));
      setResult(null);
      void identify({ image: ready });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that photo");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        {!photoIdReady ? (
          <p className="rounded-2xl border border-gold/30 bg-queen-deep px-4 py-3 text-sm text-gold">
            Photo ID is off: GEMINI_API_KEY is empty in .env.local. Paste a key from{" "}
            <a className="underline" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>
            , save the file, then restart npm run dev. Until then, uploads cannot read the picture.
          </p>
        ) : null}
        {photoIdReady && !ebayReady ? (
          <p className="rounded-2xl border border-gold/30 bg-queen-deep px-4 py-3 text-sm text-cream/70">
            eBay live ads are off until you paste Production App ID and Cert ID into .env.local (see{" "}
            <a className="underline text-gold" href="https://developer.ebay.com/my/keys" target="_blank" rel="noreferrer">
              Application Keys
            </a>
            ), save, and restart npm run dev.
          </p>
        ) : null}
        <div className="overflow-hidden rounded-3xl border border-gold/25 bg-queen-deep">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Scan preview" className="max-h-[420px] w-full object-contain bg-black/40" />
          ) : (
            <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-cream/60">
              <p className="font-serif text-2xl text-gold">Take or upload a photo of a coin or note</p>
              <p className="max-w-sm text-sm">
                Identification and last-sold comps run as soon as the picture is in.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-full bg-gold px-4 py-2 font-medium text-queen-ink hover:bg-gold-bright">
            Take photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0];
                event.target.value = "";
                if (next) void applyPhoto(next);
              }}
            />
          </label>
          <label className="cursor-pointer rounded-full border border-gold/40 px-4 py-2 text-cream hover:bg-gold/10">
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0];
                event.target.value = "";
                if (next) void applyPhoto(next);
              }}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => identify()}
            className="rounded-full border border-gold/40 px-4 py-2 text-gold disabled:opacity-50"
          >
            {busy ? "Identifying…" : "Identify & price"}
          </button>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-cream/70">
            Year
            <input
              value={hints.year}
              onChange={(event) => setHints({ ...hints, year: event.target.value })}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
              placeholder="1964"
            />
          </label>
          <label className="text-sm text-cream/70">
            Country
            <input
              value={hints.country}
              onChange={(event) => setHints({ ...hints, country: event.target.value })}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
              placeholder="United States"
            />
          </label>
          <label className="text-sm text-cream/70">
            Denomination
            <input
              value={hints.denomination}
              onChange={(event) => setHints({ ...hints, denomination: event.target.value })}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
              placeholder="50 cents / $1"
            />
          </label>
          <label className="text-sm text-cream/70">
            Type
            <select
              value={hints.type}
              onChange={(event) =>
                setHints({ ...hints, type: event.target.value as typeof hints.type })
              }
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
            >
              <option value="">Either</option>
              <option value="coin">Coin</option>
              <option value="note">Paper money</option>
            </select>
          </label>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-money">Try a sample</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => loadSample(sample.id)}
                className="rounded-full border border-gold/25 px-3 py-1.5 text-sm text-cream/80 hover:border-gold"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-2xl text-money">Market match</h2>
        {busy ? <p className="text-gold">Identifying and loading last solds…</p> : null}
        {!result && !busy ? (
          <p className="text-cream/55">
            Upload a photo and last-sold comps from eBay and Heritage appear here automatically.
          </p>
        ) : null}
        {result ? (
          <>
            {result.usedAi ? (
              <p className="text-sm text-gold">Photo read with Gemini, then matched to the catalog.</p>
            ) : (
              <p className="text-sm text-cream/55">
                {result.message ||
                  "Matched from hints and the local catalog. Set GEMINI_API_KEY to identify from the photo itself."}
              </p>
            )}
            {result.vision && Object.keys(result.vision).length > 0 ? (
              <div className="rounded-2xl border border-gold/20 bg-queen-deep p-4 text-sm text-cream/80">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-gold">Vision guess</p>
                {Object.entries(result.vision)
                  .filter(([, value]) => value)
                  .map(([key, value]) => (
                    <p key={key}>
                      <span className="text-cream/45">{key}: </span>
                      {value}
                    </p>
                  ))}
              </div>
            ) : null}
            {result.matches.length === 0 ? (
              <p className="text-cream/70">No catalog match yet. Add a year or denomination and try again.</p>
            ) : (
              <ul className="space-y-3">
                {result.matches.map((row, index) => (
                  <li key={row.item.id} className="rounded-2xl border border-gold/20 bg-queen-deep p-4">
                    <Link href={`/item/${row.item.id}`} className="block">
                      <div className="flex items-start gap-3">
                        <MatchThumb row={row} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-serif text-lg text-cream hover:text-gold">{row.item.name}</p>
                              <p className="text-sm text-cream/55">{row.reasons.join(" · ")}</p>
                            </div>
                            <p className="shrink-0 text-gold">{formatMoney(row.item.marketMid)}</p>
                          </div>
                          <p className="mt-2 text-xs text-cream/40">
                            Range {formatMoney(row.item.marketLow)} – {formatMoney(row.item.marketHigh)}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          addToCollection(row.item.id);
                          setSaved(row.item.id);
                        }}
                        className="rounded-full border border-gold/30 px-3 py-1.5 text-sm text-cream hover:border-gold"
                      >
                        {saved === row.item.id ? "Saved" : "Add to collection"}
                      </button>
                      <Link
                        href={`/sell?item=${row.item.id}`}
                        className="rounded-full bg-gold px-3 py-1.5 text-sm font-medium text-queen-ink"
                      >
                        List for sale
                      </Link>
                    </div>
                    {index === 0 && row.ebay && row.heritage ? (
                      <div className="mt-5 grid gap-6">
                        <div>
                          <h3 className="font-serif text-xl text-money">For sale on MyVaultExchange</h3>
                          <p className="mt-1 text-xs text-cream/45">
                            Live shop ads for this piece: photo, grade, seller, and price.
                          </p>
                          <div className="mt-3">
                            <MarketGrid catalogId={row.item.id} limit={6} compact />
                          </div>
                        </div>
                        <SoldColumn
                          compact
                          title="For sale on eBay"
                          feed={row.forSale ?? { rows: [], mode: "listed", searchUrl: row.ebay.searchUrl }}
                          sampleEmpty="No live eBay ad with a photo yet. Use Search live to open current listings."
                        />
                        <SoldColumn
                          compact
                          title={EBAY_SOLD}
                          feed={row.ebay}
                          sampleEmpty="No eBay sold row yet. Use Search live."
                        />
                        <SoldColumn
                          compact
                          title={HERITAGE}
                          feed={row.heritage}
                          sampleEmpty="No Heritage sold row yet. Use Search live."
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function MatchThumb({ row }: { row: MatchRow }) {
  const livePhoto = listingPhotoSrc(row.forSale?.rows.find((comp) => comp.imageUrl)?.imageUrl);
  if (livePhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={livePhoto}
        alt=""
        referrerPolicy="no-referrer"
        className="h-20 w-20 shrink-0 rounded-xl object-cover bg-black/10"
      />
    );
  }
  return <PieceArt id={row.item.id} className="h-20 w-20 shrink-0 rounded-xl" />;
}
