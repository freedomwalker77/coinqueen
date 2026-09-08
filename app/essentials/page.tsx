import { AccountScreen } from "@/components/AccountScreen";
import Link from "next/link";

export default function EssentialsPage() {
  return (
    <AccountScreen
      eyebrow="Account"
      title="Collector essentials"
      blurb="Catalog, market comps, and your collection — the tools for coins and paper, not trading cards."
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/catalog" className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-queen-ink">
          Catalog
        </Link>
        <Link href="/market" className="rounded-full border border-money/25 px-4 py-2 text-sm text-cream">
          Market
        </Link>
        <Link href="/collection" className="rounded-full border border-money/25 px-4 py-2 text-sm text-cream">
          Collection
        </Link>
      </div>
    </AccountScreen>
  );
}
