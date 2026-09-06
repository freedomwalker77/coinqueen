"use client";

import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/catalog";

export function CatalogFilters({
  query,
  category,
}: {
  query: string;
  category: string;
}) {
  const router = useRouter();

  function update(next: { q?: string; category?: string }) {
    const q = next.q ?? query;
    const cat = next.category ?? category;
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (cat && cat !== "all") sp.set("category", cat);
    const qs = sp.toString();
    router.push(qs ? `/catalog?${qs}` : "/catalog");
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          update({ q: String(data.get("q") ?? "") });
        }}
      >
        <input
          name="q"
          defaultValue={query}
          placeholder="Search year, mint, series, country…"
          className="w-full rounded-full border border-gold/25 bg-queen-card px-4 py-2.5 text-cream outline-none placeholder:text-cream/35 focus:border-gold"
        />
        <button
          type="submit"
          className="rounded-full bg-gold px-5 py-2.5 font-medium text-queen-ink hover:bg-gold-bright"
        >
          Search
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat.id || (cat.id === "all" && !category);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => update({ category: cat.id })}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                active
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-gold/20 text-cream/70 hover:border-gold/50"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
