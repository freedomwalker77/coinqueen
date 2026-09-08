import { AccountScreen } from "@/components/AccountScreen";
import Link from "next/link";

export default function HelpPage() {
  return (
    <AccountScreen
      eyebrow="Account"
      title="Help center"
      blurb="How selling, eBay, and payouts work on MyVaultExchange."
    >
      <ul className="space-y-3 text-cream/80">
        <li>Shop listings live on your store. Use Edit or Delete on lots you posted.</li>
        <li>
          Cross-post to eBay from Sell. Worldwide buyers are a Shipping policy on the eBay site you sell from.
        </li>
        <li>
          <Link href="/privacy" className="text-gold hover:underline">
            Privacy
          </Link>
        </li>
      </ul>
    </AccountScreen>
  );
}
