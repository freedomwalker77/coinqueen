"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { catalog, formatMoney, type CatalogItem } from "@/lib/catalog";
import { useMarket } from "@/lib/localMarket";

type MatchRow = {
  item: CatalogItem;
  score: number;
  reasons: string[];
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

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
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

  useEffect(() => {
    let stream: MediaStream | undefined;
    if (!cameraOn) return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((media) => {
        stream = media;
        if (videoRef.current) videoRef.current.srcObject = media;
      })
      .catch(() => {
        setError("Camera permission was blocked. You can still upload a photo.");
        setCameraOn(false);
      });
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOn]);

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const next = new File([blob], "scan.jpg", { type: "image/jpeg" });
      setFile(next);
      setPreview(URL.createObjectURL(blob));
      setCameraOn(false);
    }, "image/jpeg", 0.86);
  }

  async function identify(extra?: { sampleId?: string }) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      if (file) body.set("image", file);
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border border-gold/25 bg-queen-deep">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Scan preview" className="max-h-[420px] w-full object-contain bg-black/40" />
          ) : cameraOn ? (
            <video ref={videoRef} autoPlay playsInline className="max-h-[420px] w-full bg-black object-cover" />
          ) : (
            <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-cream/60">
              <p className="font-serif text-2xl text-gold">Point the camera at a coin or note</p>
              <p className="max-w-sm text-sm">
                Snap a photo or upload one. Optional hints (year, country, denomination) make matching
                sharper. Add a Gemini API key for photo identification.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!cameraOn ? (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
                setCameraOn(true);
              }}
              className="rounded-full bg-gold px-4 py-2 font-medium text-queen-ink hover:bg-gold-bright"
            >
              Open camera
            </button>
          ) : (
            <button
              type="button"
              onClick={captureFrame}
              className="rounded-full bg-gold px-4 py-2 font-medium text-queen-ink hover:bg-gold-bright"
            >
              Capture
            </button>
          )}
          <label className="cursor-pointer rounded-full border border-gold/40 px-4 py-2 text-cream hover:bg-gold/10">
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0];
                if (!next) return;
                setFile(next);
                setPreview(URL.createObjectURL(next));
                setCameraOn(false);
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
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-cream/70">
            Year
            <input
              value={hints.year}
              onChange={(event) => setHints({ ...hints, year: event.target.value })}
              className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
              placeholder="1964"
            />
          </label>
          <label className="text-sm text-cream/70">
            Country
            <input
              value={hints.country}
              onChange={(event) => setHints({ ...hints, country: event.target.value })}
              className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
              placeholder="United States"
            />
          </label>
          <label className="text-sm text-cream/70">
            Denomination
            <input
              value={hints.denomination}
              onChange={(event) => setHints({ ...hints, denomination: event.target.value })}
              className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
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
              className="mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream"
            >
              <option value="">Either</option>
              <option value="coin">Coin</option>
              <option value="note">Paper money</option>
            </select>
          </label>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold/80">Try a sample</p>
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
        <h2 className="font-serif text-2xl text-cream">Market match</h2>
        {!result ? (
          <p className="text-cream/55">
            Results land here: identified piece, mid-market price, sold comps, and a link into the
            catalog.
          </p>
        ) : (
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
              <div className="rounded-2xl border border-gold/20 bg-queen-card p-4 text-sm text-cream/80">
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
                {result.matches.map((row) => (
                  <li
                    key={row.item.id}
                    className="rounded-2xl border border-gold/20 bg-queen-card p-4"
                  >
                    <Link href={`/item/${row.item.id}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-lg text-cream hover:text-gold">{row.item.name}</p>
                          <p className="text-sm text-cream/55">{row.reasons.join(" · ")}</p>
                        </div>
                        <p className="text-gold">{formatMoney(row.item.marketMid)}</p>
                      </div>
                      <p className="mt-2 text-xs text-cream/40">
                        Range {formatMoney(row.item.marketLow)} – {formatMoney(row.item.marketHigh)}
                      </p>
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
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
