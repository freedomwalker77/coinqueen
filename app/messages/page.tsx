import { AccountScreen } from "@/components/AccountScreen";

export default function MessagesPage() {
  return (
    <AccountScreen
      eyebrow="Account"
      title="Messages"
      blurb="Buyer and seller notes will land here. For now, use the email on your account."
    >
      <p className="text-cream/55">No messages yet.</p>
    </AccountScreen>
  );
}
