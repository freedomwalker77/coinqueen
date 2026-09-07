"use client";

import { listingPhotoSrc } from "@/lib/ebayImage";
import { formatMoney } from "@/lib/catalog";
import type { Comp } from "@/lib/catalog";
import type { CompFeed } from "@/lib/comps";
import { PieceArt } from "@/components/PieceArt";
import Link from "next/link";

export function SoldColumn({
  title,
  feed,
  sampleEmpty,
  compact = false,
}: {
  title: string;
  feed: CompFeed;
  sampleEmpty: string;
  compact?: boolean;
}) {
  const caption =
    feed.mode === "sold"
      ? "Completed sales. Photo and title come from the eBay listing when the live feed is on."
      : feed.mode === "listed"
        ? "Live eBay ads: photo, title, seller, and asking price when search finds them."
        : "Catalog samples until a live feed is available. Use Search live for current auction results.";

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={compact ? "font-serif text-xl text-money" : "font-serif text-2xl text-money"}>{title}</h2>
        <Link href={feed.searchUrl} target="_blank" rel="noreferrer" className="text-sm text-gold hover:underline">
          Search live
        </Link>
      </div>
      <p className="mt-1 text-xs text-cream/45">{caption}</p>
      <ul className={compact ? "mt-3 space-y-2" : "mt-4 space-y-3"}>
        {feed.rows.length === 0 ? (
          <li className="text-sm text-cream/55">{sampleEmpty}</li>
        ) : (
          feed.rows.map((comp, index) => <SoldRow key={`${comp.date}-${comp.price}-${index}`} comp={comp} />)
        )}
      </ul>
    </section>
  );
}

function SoldRow({ comp }: { comp: Comp }) {
  const inner = (
    <>
      <AdThumb comp={comp} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-cream">
          {comp.title || `${comp.grade} · ${comp.venue}`}
        </p>
        <p className="mt-0.5 text-xs text-cream/55">
          {comp.grade}
          {comp.seller ? ` · ${comp.seller}` : ""}
          {` · ${comp.venue}`}
          {comp.kind === "listed" ? " · asking" : " · sold"}
          {` · ${comp.date}`}
        </p>
        {comp.details ? (
          <p className="mt-1 line-clamp-2 text-xs text-cream/50">{comp.details}</p>
        ) : null}
      </div>
      <p className="shrink-0 text-gold">{formatMoney(comp.price)}</p>
    </>
  );
  const className =
    "flex items-start gap-3 rounded-xl border border-money/15 bg-queen-deep p-3 text-sm hover:border-gold";
  if (!comp.url) {
    return <li className={className}>{inner}</li>;
  }
  return (
    <li>
      <a href={comp.url} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    </li>
  );
}

function AdThumb({ comp }: { comp: Comp }) {
  const src = listingPhotoSrc(comp.imageUrl);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className="h-24 w-24 shrink-0 rounded-lg object-cover bg-black/10"
      />
    );
  }
  if (comp.catalogId) {
    return <PieceArt id={comp.catalogId} className="h-24 w-24 shrink-0 rounded-lg" />;
  }
  return <div className="h-24 w-24 shrink-0 rounded-lg bg-money/10" />;
}
