"use client";

import { Footer, Header } from "@/components/Chrome";
import { PieceArt } from "@/components/PieceArt";
import { formatMoney, getItem } from "@/lib/catalog";
import { useMarket } from "@/lib/localMarket";
import Link from "next/link";

export default function CollectionPage() {
  const { ready, state, removeFromCollection } = useMarket();
  const rows = ready ? state.collection : [];

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Cabinet</p>
        <h1 className="mt-2 font-serif text-4xl text-cream">Your collection</h1>
        <p className="mt-2 max-w-2xl text-cream/60">
          Pieces you saved from the scanner or catalog. Signed-in cabinets sync to your
          account.
        </p>
        {rows.length === 0 ? (
          <p className="mt-10 text-cream/55">
            Empty cabinet.{" "}
            <Link href="/scan" className="text-gold hover:underline">
              Scan a piece
            </Link>{" "}
            or add one from a catalog page.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {rows.map((row) => {
              const item = getItem(row.catalogId);
              if (!item) return null;
              return (
                <li
                  key={row.id}
                  className="flex gap-4 overflow-hidden rounded-2xl border border-gold/20 bg-queen-card"
                >
                  <PieceArt id={item.id} className="h-28 w-36 shrink-0" />
                  <div className="flex flex-1 flex-col justify-center py-3 pr-4">
                    <Link href={`/item/${item.id}`} className="font-serif text-lg text-cream hover:text-gold">
                      {item.shortName}
                    </Link>
                    <p className="text-sm text-cream/55">
                      {row.grade} · mid {formatMoney(item.marketMid)}
                    </p>
                    <div className="mt-2 flex gap-3 text-sm">
                      <Link href={`/sell?item=${item.id}`} className="text-gold hover:underline">
                        List
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCollection(row.id)}
                        className="text-cream/45 hover:text-cream"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
