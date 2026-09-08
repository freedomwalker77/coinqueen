import { AccountScreen } from "@/components/AccountScreen";

export default function DealsPage() {
  return (
    <AccountScreen
      eyebrow="Selling"
      title="Discounts & deals"
      blurb="Store-wide deals for your shop will sit here. List a lot at the price you want for now."
    >
      <p className="text-cream/55">No promotions yet.</p>
    </AccountScreen>
  );
}
