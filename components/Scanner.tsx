"use client";

import { getEbayStatus, listOnEbay } from "@/app/actions/ebay";
import { MarketGrid } from "@/components/MarketGrid";
import { PieceArt } from "@/components/PieceArt";
import { catalog, formatMoney, type CatalogItem, type Comp } from "@/lib/catalog";
import type { CompFeed } from "@/lib/comps";
import { listingPhotoSrc } from "@/lib/ebayImage";
import { useMarket } from "@/lib/localMarket";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

type ScanLot = {
  id: string;
  preview: string;
  status: "pricing" | "ready" | "error";
  error?: string;
  match?: MatchRow;
  title: string;
  grade: string;
  price: string;
  photoSource: "scan" | "ebay";
  ebayImageUrl?: string;
  selectedComp?: Comp;
};

const SAMPLES = [
  { id: "1881-s-morgan-dollar", label: "Morgan dollar" },
  { id: "1935a-silver-certificate", label: "Silver certificate" },
  { id: "1900-gold-sovereign", label: "Gold sovereign" },
  { id: "hadrian-denarius", label: "Roman denarius" },
];

const GRADES = ["Raw", "VG-8", "F-12", "VF-20", "EF-40", "AU-50", "MS-63", "MS-65", "CU"];

function medianPrice(feed?: CompFeed) {
  const prices = (feed?.rows ?? []).map((row) => row.price).filter((n) => n > 0).sort((a, b) => a - b);
  if (!prices.length) return null;
  return prices[Math.floor(prices.length / 2)];
}

function lotPrice(lot: ScanLot) {
  const n = Number(lot.price);
  if (Number.isFinite(n) && n > 0) return n;
  return medianPrice(lot.match?.forSale) ?? medianPrice(lot.match?.ebay) ?? lot.match?.item.marketMid ?? 0;
}

function publicEbayImage(url?: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

async function prepareScanFile(file: File): Promise<File> {
  const type = file.type.toLowerCase();
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that photo. Try JPEG or PNG."));
      el.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height) || 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob && (type === "image/jpeg" || type === "image/png" || type === "image/webp")) return file;
    if (!blob) throw new Error("Could not read that photo.");
    return new File([blob], "scan.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function filePreview(file: File) {
  const ready = await prepareScanFile(file);
  const preview = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.readAsDataURL(ready);
  });
  return { ready, preview };
}

export function Scanner({
  photoIdReady = false,
  ebayReady = false,
}: {
  photoIdReady?: boolean;
  ebayReady?: boolean;
}) {
  const { publishListing, account } = useMarket();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [queue, setQueue] = useState<ScanLot[]>([]);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [busySnap, setBusySnap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [alsoEbay, setAlsoEbay] = useState(false);
  const [ebay, setEbay] = useState({ connected: false, subscribed: false });
  const [hints, setHints] = useState({ year: "", country: "", denomination: "", type: "" as "" | "coin" | "note" });

  useEffect(() => {
    void getEbayStatus().then((row) => setEbay({ connected: row.connected, subscribed: row.subscribed }));
  }, []);

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setError("Camera is blocked. Use Take photo or Upload instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function identifyImage(image: File, sampleId?: string) {
    const body = new FormData();
    body.set("image", image);
    body.set("queue", "1");
    body.set("year", hints.year);
    body.set("country", hints.country);
    body.set("denomination", hints.denomination);
    body.set("type", hints.type);
    if (sampleId) body.set("sampleId", sampleId);
    const response = await fetch("/api/identify", { method: "POST", body });
    const json = (await response.json()) as IdentifyResponse & { error?: string };
    if (!response.ok) throw new Error(json.error || "Identify failed");
    return json;
  }

  function patchLot(id: string, patch: Partial<ScanLot>) {
    setQueue((prev) => prev.map((lot) => (lot.id === id ? { ...lot, ...patch } : lot)));
  }

  function enqueue(preview: string, image?: File, sampleId?: string) {
    const id = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const lot: ScanLot = {
      id,
      preview,
      status: "pricing",
      title: "Identifying…",
      grade: "Raw",
      price: "",
      photoSource: "scan",
    };
    setQueue((prev) => [...prev, lot]);
    setError(null);
    void (async () => {
      try {
        const json = await identifyImage(image ?? new File([], "empty"), sampleId);
        const match = json.matches[0];
        if (!match) {
          patchLot(id, { status: "error", error: json.message || "No catalog match yet." });
          return;
        }
        const similar =
          match.forSale?.rows.find((row) => row.imageUrl) ?? match.ebay?.rows.find((row) => row.imageUrl);
        const mid = medianPrice(match.forSale) ?? medianPrice(match.ebay) ?? match.item.marketMid;
        patchLot(id, {
          status: "ready",
          match,
          title: match.item.shortName,
          grade: match.item.type === "note" ? "CU" : "AU-50",
          price: String(Math.round(mid * 100) / 100),
          selectedComp: similar,
          ebayImageUrl: publicEbayImage(similar?.imageUrl),
        });
      } catch (err) {
        patchLot(id, { status: "error", error: err instanceof Error ? err.message : "Identify failed" });
      }
    })();
  }

  async function applyFile(file: File) {
    try {
      const { ready, preview } = await filePreview(file);
      enqueue(preview, ready);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that photo");
    }
  }

  async function snap() {
    const video = videoRef.current;
    if (!video || video.videoWidth < 2) return;
    setBusySnap(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const preview = canvas.toDataURL("image/jpeg", 0.86);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    setBusySnap(false);
    if (!blob) return;
    enqueue(preview, new File([blob], "scan.jpg", { type: "image/jpeg" }));
  }

  function loadSample(id: string) {
    const item = catalog.find((piece) => piece.id === id);
    if (!item) return;
    setHints({
      year: item.year ? String(item.year) : "",
      country: item.country,
      denomination: item.denomination,
      type: item.type,
    });
    enqueue("", undefined, id);
  }

  const reviewing = reviewIndex != null ? queue[reviewIndex] : null;

  async function publishLots(ids: string[]) {
    if (!account) {
      setPublishMsg("Sign in to publish into your shop.");
      return;
    }
    const rows = queue.filter((lot) => ids.includes(lot.id) && lot.status === "ready" && lot.match);
    if (!rows.length) return;
    setPublishMsg("Publishing…");
    const notes: string[] = [];
    let ebayPlanNote = false;
    for (const lot of rows) {
      const listingId = `user-${Date.now()}-${lot.id.slice(-5)}`;
      const price = lotPrice(lot);
      const ebayImage = lot.photoSource === "ebay" ? lot.ebayImageUrl : publicEbayImage(lot.selectedComp?.imageUrl);
      const shopPhoto = lot.photoSource === "ebay" && lot.ebayImageUrl ? lot.ebayImageUrl : lot.preview;
      let ebayUrl: string | undefined;
      if (alsoEbay) {
        if (!ebay.connected || !ebay.subscribed) {
          ebayPlanNote = true;
        } else if (!ebayImage) {
          notes.push(`${lot.title}: pick a similar eBay photo to list on eBay.`);
        } else {
          try {
            const result = await listOnEbay({
              listingId,
              catalogId: lot.match!.item.id,
              grade: lot.grade,
              price,
              note: lot.title,
              imageUrl: ebayImage,
            });
            if ("error" in result && result.error) notes.push(`${lot.title}: ${result.error}`);
            else if ("url" in result) ebayUrl = result.url;
          } catch {
            notes.push(`${lot.title}: eBay timed out. Shop listing still published.`);
          }
        }
      }
      publishListing({
        id: listingId,
        catalogId: lot.match!.item.id,
        grade: lot.grade,
        price,
        kind: "buy_now",
        note: lot.title,
        ebayUrl,
        photoUrl: shopPhoto || undefined,
      });
    }
    setQueue((prev) => prev.filter((lot) => !ids.includes(lot.id)));
    setReviewIndex(null);
    if (ebayPlanNote) notes.unshift("eBay listing needs a connected eBay account and the monthly plan.");
    setPublishMsg(
      notes.length
        ? `Published ${rows.length} to your shop. ${notes[0]}`
        : `Published ${rows.length} to your shop.`,
    );
  }

  if (reviewing) {
    const index = reviewIndex ?? 0;
    const similar = [
      ...(reviewing.match?.forSale?.rows ?? []),
      ...(reviewing.match?.ebay?.rows ?? []),
    ].filter((row, i, all) => row.imageUrl && all.findIndex((item) => item.imageUrl === row.imageUrl) === i);
    const mainSrc =
      reviewing.photoSource === "ebay" && reviewing.ebayImageUrl
        ? listingPhotoSrc(reviewing.ebayImageUrl)
        : reviewing.preview;

    return (
      <div
        className="mx-auto max-w-3xl"
        onTouchStart={(event) => {
          (event.currentTarget as HTMLDivElement & { swipeX?: number }).swipeX = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          const start = (event.currentTarget as HTMLDivElement & { swipeX?: number }).swipeX;
          if (start == null) return;
          const dx = event.changedTouches[0].clientX - start;
          if (dx < -48 && index < queue.length - 1) setReviewIndex(index + 1);
          if (dx > 48 && index > 0) setReviewIndex(index - 1);
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setReviewIndex(null)} className="text-sm text-gold hover:underline">
            Close
          </button>
          <p className="text-sm text-cream/60">
            {index + 1} of {queue.length} · Swipe
          </p>
          <button
            type="button"
            onClick={() => {
              setQueue((prev) => prev.filter((lot) => lot.id !== reviewing.id));
              setReviewIndex(queue.length <= 1 ? null : Math.min(index, queue.length - 2));
            }}
            className="text-sm text-red-700 hover:underline"
          >
            Delete
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto">
          <div
            className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-gold"
            role="button"
            tabIndex={0}
            onClick={() => patchLot(reviewing.id, { photoSource: "scan" })}
          >
            {mainSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainSrc} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              <PieceArt id={reviewing.match?.item.id ?? "1881-s-morgan-dollar"} className="h-full w-full" />
            )}
            <span className="absolute left-1 top-1 rounded bg-gold px-1.5 text-[10px] font-medium text-queen-ink">
              Main
            </span>
          </div>
          <label className="flex h-36 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-gold/30 text-sm text-gold">
            Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void filePreview(file).then(({ preview }) =>
                  patchLot(reviewing.id, { preview, photoSource: "scan" }),
                );
              }}
            />
          </label>
          <label className="flex h-36 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-gold/30 text-sm text-gold">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void filePreview(file).then(({ preview }) =>
                  patchLot(reviewing.id, { preview, photoSource: "scan" }),
                );
              }}
            />
          </label>
        </div>

        <h2 className="mt-6 font-serif text-3xl text-money">{reviewing.title}</h2>
        {reviewing.match ? (
          <p className="mt-1 text-sm text-cream/55">
            {reviewing.match.item.year} · {reviewing.match.item.country} · {reviewing.match.reasons.join(" · ")}
          </p>
        ) : null}

        <div className="mt-6 flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Similar on eBay</p>
          <p className="font-serif text-xl text-gold">Median ~{formatMoney(lotPrice(reviewing))}</p>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {similar.length === 0 ? (
            <p className="text-sm text-cream/50">No live eBay photos yet. You can still publish your scan photo to the shop.</p>
          ) : (
            similar.map((comp) => {
              const selected = reviewing.selectedComp?.imageUrl === comp.imageUrl;
              return (
                <button
                  key={`${comp.url}-${comp.price}`}
                  type="button"
                  onClick={() =>
                    patchLot(reviewing.id, {
                      selectedComp: comp,
                      ebayImageUrl: publicEbayImage(comp.imageUrl),
                      photoSource: "ebay",
                      price: reviewing.price || String(comp.price),
                    })
                  }
                  className={`w-32 shrink-0 rounded-xl border p-2 text-left ${
                    selected ? "border-gold bg-gold/10" : "border-money/15 bg-queen-deep"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={listingPhotoSrc(comp.imageUrl)}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <p className="mt-1 font-medium text-gold">{formatMoney(comp.price)}</p>
                  <p className="line-clamp-2 text-[11px] text-cream/55">{comp.title || comp.grade}</p>
                </button>
              );
            })
          )}
        </div>
        {reviewing.match?.forSale?.searchUrl ? (
          <a
            href={reviewing.match.forSale.searchUrl}
            className="mt-2 inline-block text-sm text-gold hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Search live on eBay
          </a>
        ) : null}

        {reviewing.match ? (
          <div className="mt-6">
            <MarketGrid catalogId={reviewing.match.item.id} limit={4} compact />
          </div>
        ) : null}

        <div className="mt-6 space-y-3 rounded-2xl border border-money/20 bg-queen-deep p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-money">Listing</p>
          <label className="block text-sm text-cream/70">
            Title
            <input
              value={reviewing.title}
              onChange={(event) => patchLot(reviewing.id, { title: event.target.value })}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-cream/70">
              Price (USD)
              <input
                value={reviewing.price}
                onChange={(event) => patchLot(reviewing.id, { price: event.target.value })}
                className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
              />
            </label>
            <label className="text-sm text-cream/70">
              Grade
              <select
                value={reviewing.grade}
                onChange={(event) => patchLot(reviewing.id, { grade: event.target.value })}
                className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2 text-cream"
              >
                {GRADES.map((grade) => (
                  <option key={grade}>{grade}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-cream/50">
            Shop uses your scan photo, or the similar eBay photo you tap. eBay cross-post uses that eBay
            listing image — no Imgur.
          </p>
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input
              type="checkbox"
              checked={alsoEbay}
              disabled={!ebay.connected || !ebay.subscribed}
              onChange={(event) => setAlsoEbay(event.target.checked)}
            />
            Also list on eBay
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setReviewIndex(index - 1)}
            className="rounded-full border border-money/25 px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={index >= queue.length - 1}
            onClick={() => setReviewIndex(index + 1)}
            className="rounded-full border border-money/25 px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => void publishLots(queue.filter((lot) => lot.status === "ready").map((lot) => lot.id))}
            className="rounded-full border border-gold px-4 py-2 text-sm text-gold"
          >
            Publish all ready
          </button>
          <button
            type="button"
            onClick={() => void publishLots([reviewing.id])}
            className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-queen-ink"
          >
            Publish this
          </button>
        </div>
        {publishMsg ? <p className="mt-3 text-sm text-cream/70">{publishMsg}</p> : null}
      </div>
    );
  }

  const readyCount = queue.filter((lot) => lot.status === "ready").length;

  return (
    <div className="space-y-4">
      {!photoIdReady ? (
        <p className="rounded-2xl border border-gold/30 bg-queen-deep px-4 py-3 text-sm text-gold">
          Photo ID is off until GEMINI_API_KEY is set. Uploads still queue; comps need the key to read the
          picture.
        </p>
      ) : null}
      {photoIdReady && !ebayReady ? (
        <p className="rounded-2xl border border-gold/30 bg-queen-deep px-4 py-3 text-sm text-cream/70">
          eBay live ads need Production App ID and Cert ID in env.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-gold/25 bg-queen-ink">
        {cameraOn ? (
          <video ref={videoRef} autoPlay playsInline muted className="max-h-[52vh] w-full bg-black object-cover" />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center text-cream/60">
            <p className="font-serif text-2xl text-gold">Scan coins and notes</p>
            <p className="max-w-sm text-sm">
              Snap several photos in a row. Prices from eBay fill in under each thumbnail while you keep
              shooting.
            </p>
          </div>
        )}
      </div>

      {queue.length > 0 ? (
        <div>
          <div className="flex items-center justify-between text-sm">
            <p className="text-cream/70">{queue.length} in queue</p>
            <button type="button" onClick={() => setQueue([])} className="text-gold hover:underline">
              Clear all
            </button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {queue.map((lot, index) => (
              <button
                key={lot.id}
                type="button"
                onClick={() => setReviewIndex(index)}
                className="w-24 shrink-0 overflow-hidden rounded-xl border border-money/20 bg-queen-deep"
              >
                {lot.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lot.preview} alt="" className="h-20 w-full object-cover" />
                ) : (
                  <PieceArt id={lot.match?.item.id ?? "1881-s-morgan-dollar"} className="h-20 w-full" />
                )}
                <p className="bg-gold px-1 py-1 text-center text-xs font-medium text-queen-ink">
                  {lot.status === "pricing"
                    ? "…"
                    : lot.status === "error"
                      ? "—"
                      : formatMoney(lotPrice(lot))}
                </p>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={readyCount === 0}
            onClick={() => setReviewIndex(queue.findIndex((lot) => lot.status === "ready"))}
            className="mt-3 w-full rounded-full bg-gold py-3 font-medium text-queen-ink disabled:opacity-50"
          >
            Review & publish ({readyCount})
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-4">
        <label className="cursor-pointer text-sm text-gold hover:underline">
          Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void applyFile(file);
            }}
          />
        </label>
        {cameraOn ? (
          <>
            <button
              type="button"
              disabled={busySnap}
              onClick={() => void snap()}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-gold bg-gold/20 text-gold"
              aria-label="Take photo"
            >
              ◉
            </button>
            <button type="button" onClick={stopCamera} className="text-sm text-cream/60 hover:underline">
              Close camera
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void startCamera()}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-gold bg-gold text-sm font-medium text-queen-ink"
            >
              Camera
            </button>
            <label className="cursor-pointer text-sm text-gold hover:underline">
              Take photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void applyFile(file);
                }}
              />
            </label>
          </>
        )}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {publishMsg ? <p className="text-sm text-cream/70">{publishMsg}</p> : null}
      {!account ? (
        <p className="text-center text-sm text-cream/50">
          <Link href="/login" className="text-gold hover:underline">
            Sign in
          </Link>{" "}
          to publish the queue to your shop.
        </p>
      ) : null}

      <details className="rounded-2xl border border-money/15 bg-queen-deep p-4 text-sm">
        <summary className="cursor-pointer text-cream/70">Hints if the photo is unclear</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-cream/70">
            Year
            <input
              value={hints.year}
              onChange={(event) => setHints({ ...hints, year: event.target.value })}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2"
            />
          </label>
          <label className="text-cream/70">
            Country
            <input
              value={hints.country}
              onChange={(event) => setHints({ ...hints, country: event.target.value })}
              className="mt-1 w-full rounded-xl border border-money/20 bg-queen px-3 py-2"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => loadSample(sample.id)}
              className="rounded-full border border-gold/25 px-3 py-1.5 text-cream/80 hover:border-gold"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
