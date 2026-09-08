import { AccountScreen } from "@/components/AccountScreen";

export default function ChestsPage() {
  return (
    <AccountScreen
      eyebrow="Selling"
      title="Mystery chests"
      blurb="Optional surprise lots (mixed coins or notes) you can offer from your shop. Not live yet."
    >
      <p className="text-cream/55">Mystery chests are not enabled.</p>
    </AccountScreen>
  );
}
