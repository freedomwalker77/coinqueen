import Link from "next/link";
import { formatMoney, type CatalogItem } from "@/lib/catalog";
import { PieceArt } from "./PieceArt";

export function ItemCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      href={`/item/${item.id}`}
      className="group overflow-hidden rounded-2xl border border-money/20 bg-queen shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg hover:shadow-gold/15"
    >
      <PieceArt id={item.id} className="h-40 w-full" />
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-money">
          <span>{item.type === "coin" ? "Coin" : "Paper"}</span>
          <span className="text-cream/30">·</span>
          <span className="text-cream/55">{item.country}</span>
        </div>
        <h3 className="font-serif text-lg leading-snug text-cream group-hover:text-gold">
          {item.shortName}
        </h3>
        <p className="text-sm text-cream/55">{item.series}</p>
        <div className="flex items-baseline justify-between pt-1">
          <p className="text-cream">
            <span className="text-xs text-cream/45">Mid market </span>
            <span className="font-medium">{formatMoney(item.marketMid)}</span>
          </p>
          <p className="text-xs capitalize text-gold/80">{item.rarity}</p>
        </div>
      </div>
    </Link>
  );
}
