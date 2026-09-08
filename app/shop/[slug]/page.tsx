import { Footer, Header } from "@/components/Chrome";
import { MarketGrid } from "@/components/MarketGrid";
import { findUserByShopSlug } from "@/lib/db";
import { getShop, isDemoShop, shopFromAccount } from "@/lib/market";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

function safeEbayListingUrl(raw?: string) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (!/(^|\.)ebay\.(com|ca)$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ listed?: string; ebay?: string; ebay_error?: string }>;
}) {
  const { slug } = await params;
  const { listed, ebay, ebay_error: ebayError } = await searchParams;
  const ebayUrl = safeEbayListingUrl(ebay);
  const session = await getSessionUser();
  const owner = findUserByShopSlug(slug);
  const shop = owner
    ? shopFromAccount(owner.name, owner.shopSlug, owner.bio)
    : session?.shopSlug === slug
      ? shopFromAccount(session.name, slug)
      : getShop(slug);
  if (!shop) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">Shop</p>
        <h1 className="mt-2 font-serif text-4xl text-money">{shop.name}</h1>
        <p className="mt-2 max-w-2xl text-cream/60">{shop.blurb}</p>
        <p className="mt-3 text-sm text-gold">
          {shop.rating.toFixed(1)} · {shop.reviews} reviews
        </p>
        {session && session.shopSlug !== slug && !isDemoShop(slug) ? (
          <Link
            href={`/messages?to=${encodeURIComponent(slug)}`}
            className="mt-4 inline-flex rounded-full bg-gold px-4 py-2 text-sm font-medium text-queen-ink hover:bg-gold-bright"
          >
            Message seller
          </Link>
        ) : null}
        {listed ? (
          <p className="mt-6 rounded-2xl border border-gold/30 bg-queen-deep px-4 py-3 text-sm text-cream">
            Listing published to your account shop.
            {ebayUrl ? (
              <>
                {" "}
                Also live on{" "}
                <a href={ebayUrl} className="text-gold underline" target="_blank" rel="noreferrer">
                  eBay
                </a>
                .
              </>
            ) : null}
            {ebayError ? <> eBay did not publish: {ebayError.slice(0, 280)}</> : null}
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
