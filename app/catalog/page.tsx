import { CatalogFilters } from "@/components/CatalogFilters";
import { Footer, Header } from "@/components/Chrome";
import { ItemCard } from "@/components/ItemCard";
import { searchCatalog } from "@/lib/catalog";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "all" } = await searchParams;
  const items = searchCatalog(q, category);

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Price guide</p>
        <h1 className="mt-2 font-serif text-4xl text-cream">Catalog</h1>
        <p className="mt-2 max-w-2xl text-cream/60">
          Browse U.S. and world coins, ancients, and paper money. Mid-market prices are starter comps —
          not a bid/ask live feed yet.
        </p>
        <div className="mt-8">
          <CatalogFilters query={q} category={category} />
        </div>
        <p className="mt-6 text-sm text-cream/45">{items.length} pieces</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
