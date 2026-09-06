import { Footer, Header } from "@/components/Chrome";
import { ItemCard } from "@/components/ItemCard";
import { MarketGrid } from "@/components/MarketGrid";
import { CATEGORIES, catalog, featuredItems, formatMoney, recentSales } from "@/lib/catalog";
import { soldVenue } from "@/lib/comps";
import Link from "next/link";

export default function HomePage() {
  const featured = featuredItems();
  const sales = recentSales();

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-gold/15">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.18),_transparent_42%)]" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-money">Coins · banknotes · bullion</p>
              <h1 className="mt-4 font-serif text-5xl leading-tight text-money md:text-6xl">
                Scan it. Price it.
                <span className="block text-gold">Collect with a crown.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-cream/75">
                CoinQueen is a collector marketplace for coins and paper money. Identify a piece, then
                price it from eBay last sold and Heritage Auctions — not trading-card feeds.
              </p>
              <form action="/catalog" className="mt-8 flex max-w-xl gap-2">
                <input
                  name="q"
                  placeholder="Search Morgan, Black Eagle, 1964, sovereign…"
                  className="w-full rounded-full border border-money/20 bg-queen px-4 py-3 text-cream outline-none placeholder:text-cream/40 focus:border-gold"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-gold px-5 py-3 font-medium text-queen-ink hover:bg-gold-bright"
                >
                  Search
                </button>
              </form>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/scan"
                  className="rounded-full bg-gold px-6 py-3 font-medium text-queen-ink hover:bg-gold-bright"
                >
                  Open the scanner
                </Link>
                <Link
                  href="/market"
                  className="rounded-full border border-money/30 px-6 py-3 text-money hover:bg-money/10"
                >
                  Shop the market
                </Link>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-center">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-money">Live catalog</dt>
                  <dd className="font-serif text-3xl text-gold">{catalog.length}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-money">Coins & notes</dt>
                  <dd className="font-serif text-3xl text-gold">Both</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-money">Scanner</dt>
                  <dd className="font-serif text-3xl text-gold">Free</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-3xl border border-money/20 bg-queen-deep p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-money">How it works</p>
              <ol className="mt-5 space-y-5 text-cream/80">
                <li>
                  <span className="font-serif text-gold">1.</span> Snap a coin or note — or type year and
                  denomination.
                </li>
                <li>
                  <span className="font-serif text-gold">2.</span> Match it to the catalog and pull eBay
                  last sold plus Heritage auction results.
                </li>
                <li>
                  <span className="font-serif text-gold">3.</span> Save it to your cabinet, list it, or
                  buy/bid on a live shop listing.
                </li>
              </ol>
              <p className="mt-6 text-sm text-cream/55">
                Sold comps come from eBay last sold and Heritage Auctions, the two places collectors
                actually buy and consign coins and notes.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-xs uppercase tracking-[0.22em] text-money">Shop by cabinet</p>
          <h2 className="mb-6 font-serif text-3xl text-money">Coins and money, one catalog</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.id}`}
                className="rounded-2xl border border-money/20 bg-queen-deep px-4 py-5 text-cream transition hover:border-gold hover:text-gold"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-money">Featured</p>
              <h2 className="font-serif text-3xl text-money">Pieces collectors chase</h2>
            </div>
            <Link href="/catalog" className="text-sm text-gold hover:underline">
              See all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="border-y border-gold/15 bg-queen-deep/80">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-money">Live now</p>
                <h2 className="font-serif text-3xl text-money">Marketplace picks</h2>
              </div>
              <Link href="/market" className="text-sm text-gold hover:underline">
                All listings
              </Link>
            </div>
            <MarketGrid limit={6} />
          </div>
        </section>

        <section className="border-b border-gold/15 bg-queen-deep/80">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <p className="text-xs uppercase tracking-[0.22em] text-money">Moving today</p>
            <h2 className="mb-6 font-serif text-3xl text-money">eBay last sold & Heritage</h2>
            <div className="overflow-hidden rounded-2xl border border-gold/15">
              <table className="w-full text-left text-sm">
                <thead className="bg-queen-deep text-money">
                  <tr>
                    <th className="px-4 py-3 font-normal">Piece</th>
                    <th className="px-4 py-3 font-normal">Grade</th>
                    <th className="px-4 py-3 font-normal">Venue</th>
                    <th className="px-4 py-3 font-normal text-right">Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(({ item, comp }) => (
                    <tr key={`${item.id}-${comp.date}-${comp.price}`} className="border-t border-gold/10">
                      <td className="px-4 py-3">
                        <Link href={`/item/${item.id}`} className="text-cream hover:text-gold">
                          {item.shortName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-cream/60">{comp.grade}</td>
                      <td className="px-4 py-3 text-cream/60">{soldVenue(comp.venue)}</td>
                      <td className="px-4 py-3 text-right text-gold">{formatMoney(comp.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
