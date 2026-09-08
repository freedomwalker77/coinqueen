import { AccountScreen } from "@/components/AccountScreen";
import Link from "next/link";

export default function TrainingPage() {
  return (
    <AccountScreen
      eyebrow="Account"
      title="My training"
      blurb="Short guides on grading, photos, and listing coins and paper on MyVaultExchange."
    >
      <ul className="space-y-3 text-cream/80">
        <li>
          <Link href="/scan" className="text-gold hover:underline">
            Scan a piece
          </Link>{" "}
          — identify from a photo, then check eBay last sold and Heritage.
        </li>
        <li>
          <Link href="/sell" className="text-gold hover:underline">
            List a lot
          </Link>{" "}
          — buy now or auction in your shop, optionally on eBay.ca.
        </li>
      </ul>
    </AccountScreen>
  );
}
