import { Footer, Header } from "@/components/Chrome";
import { MarketGrid } from "@/components/MarketGrid";
import { findUserByShopSlug } from "@/lib/db";
import { getShop, shopFromAccount } from "@/lib/market";
import { notFound } from "next/navigation";

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ listed?: string }>;
}) {
  const { slug } = await params;
  const { listed } = await searchParams;
  const owner = findUserByShopSlug(slug);
  const shop = owner ? shopFromAccount(owner.name, owner.shopSlug) : getShop(slug);
  if (!shop) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Shop</p>
        <h1 className="mt-2 font-serif text-4xl text-cream">{shop.name}</h1>
        <p className="mt-2 max-w-2xl text-cream/60">{shop.blurb}</p>
        <p className="mt-3 text-sm text-gold">
          {shop.rating.toFixed(1)} · {shop.reviews} reviews
        </p>
        {listed ? (
          <p className="mt-6 rounded-2xl border border-gold/30 bg-queen-card px-4 py-3 text-sm text-cream">
            Listing published to your account shop.
          </p>
        ) : null}
        <div className="mt-10">
          <MarketGrid shopSlug={slug} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
