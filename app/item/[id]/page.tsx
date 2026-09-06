import { Footer, Header } from "@/components/Chrome";
import { ItemCard } from "@/components/ItemCard";
import { PieceArt } from "@/components/PieceArt";
import { formatMoney, getItem, relatedItems } from "@/lib/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = getItem(id);
  if (!item) return { title: "Piece not found — CoinQueen" };
  return {
    title: `${item.name} — CoinQueen`,
    description: `${item.shortName} mid market ${formatMoney(item.marketMid)}. ${item.description}`,
  };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();
  const related = relatedItems(item);
  const popTotal = item.population.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-sm text-cream/45">
          <Link href="/catalog" className="hover:text-gold">
            Catalog
          </Link>
          <span className="px-2">/</span>
          {item.type === "coin" ? "Coin" : "Paper money"}
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <PieceArt id={item.id} className="h-72 rounded-3xl border border-gold/20" />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">
              {item.country} · {item.rarity}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-cream">{item.name}</h1>
            <p className="mt-3 text-cream/70">{item.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-gold/15 bg-queen-card p-3">
                <dt className="text-cream/40">Mid market</dt>
                <dd className="font-serif text-2xl text-gold">{formatMoney(item.marketMid)}</dd>
              </div>
              <div className="rounded-xl border border-gold/15 bg-queen-card p-3">
                <dt className="text-cream/40">Range</dt>
                <dd className="text-cream">
                  {formatMoney(item.marketLow)} – {formatMoney(item.marketHigh)}
                </dd>
              </div>
              <div className="rounded-xl border border-gold/15 bg-queen-card p-3">
                <dt className="text-cream/40">Series</dt>
                <dd className="text-cream">{item.series}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-cream/50">
              {item.year ?? "No single year"} · {item.denomination}
              {item.mint ? ` · ${item.mint}` : ""}
              {item.metal ? ` · ${item.metal}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="font-serif text-2xl text-cream">Grade ladder</h2>
            <table className="mt-4 w-full text-sm">
              <tbody>
                {item.grades.map((row) => (
                  <tr key={row.grade} className="border-b border-gold/10">
                    <td className="py-2.5 text-cream/70">{row.grade}</td>
                    <td className="py-2.5 text-right text-gold">{formatMoney(row.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-cream">Sold & listed comps</h2>
            <ul className="mt-4 space-y-3">
              {item.comps.map((comp) => (
                <li
                  key={`${comp.date}-${comp.venue}-${comp.price}`}
                  className="flex items-center justify-between rounded-xl border border-gold/15 bg-queen-card px-4 py-3 text-sm"
                >
                  <div>
                    <p className="text-cream">
                      {comp.grade} · {comp.venue}
                    </p>
                    <p className="text-cream/45">
                      {comp.date} · {comp.kind}
                    </p>
                  </div>
                  <p className="text-gold">{formatMoney(comp.price)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-12 rounded-3xl border border-gold/15 bg-queen-card p-6">
          <h2 className="font-serif text-2xl text-cream">Population on CoinQueen</h2>
          <p className="mt-1 text-sm text-cream/50">
            {popTotal} tracked copies in this starter catalog (stand-in for live marketplace supply).
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {item.population.map((row) => (
              <div key={row.grade} className="rounded-full border border-gold/20 px-4 py-2 text-sm">
                <span className="text-cream/60">{row.grade}</span>{" "}
                <span className="text-gold">{row.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 font-serif text-2xl text-cream">Related pieces</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((piece) => (
              <ItemCard key={piece.id} item={piece} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
