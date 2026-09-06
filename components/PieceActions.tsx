"use client";

import Link from "next/link";
import { useMarket } from "@/lib/localMarket";

export function PieceActions({ catalogId }: { catalogId: string }) {
  const { addToCollection, inCollection, ready } = useMarket();
  const saved = ready && inCollection(catalogId);

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => addToCollection(catalogId)}
        className="rounded-full border border-gold/40 px-4 py-2 text-sm text-cream hover:bg-gold/10"
      >
        {saved ? "In your collection" : "Add to collection"}
      </button>
      <Link
        href={`/sell?item=${catalogId}`}
        className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-queen-ink hover:bg-gold-bright"
      >
        List this piece
      </Link>
    </div>
  );
}
