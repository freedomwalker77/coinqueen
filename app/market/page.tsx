import { Footer, Header } from "@/components/Chrome";
import { MarketGrid } from "@/components/MarketGrid";
import { SHOPS } from "@/lib/market";
import Link from "next/link";

export default function MarketPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">Marketplace</p>
        <h1 className="mt-2 font-serif text-4xl text-money">Buy & bid</h1>
        <p className="mt-2 max-w-2xl text-cream/60">
          Buy-now and timed auctions. Buyers pay in USD from most countries. Connected sellers get paid
          minus MyVaultExchange’s 10% fee.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {SHOPS.filter((shop) => shop.slug !== "your-shop").map((shop) => (
            <Link
              key={shop.slug}
              href={`/shop/${shop.slug}`}
              className="rounded-full border border-gold/25 px-3 py-1.5 text-sm text-cream/80 hover:border-gold"
            >
              {shop.name}
            </Link>
          ))}
          <Link
            href="/sell"
            className="rounded-full bg-gold px-3 py-1.5 text-sm font-medium text-queen-ink"
          >
            List a piece
          </Link>
        </div>
        <div className="mt-10">
          <MarketGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
}
