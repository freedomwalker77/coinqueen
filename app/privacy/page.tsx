import { Footer, Header } from "@/components/Chrome";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">Legal</p>
        <h1 className="mt-2 font-serif text-4xl text-money">Privacy</h1>
        <div className="mt-6 space-y-4 text-cream/75">
          <p>
            MyVaultExchange accounts store the email and shop details you enter on this site, plus listings
            and orders you create here.
          </p>
          <p>
            When you scan a piece, we send the photo to Google Gemini to identify it. We do not use
            that photo as an eBay login.
          </p>
          <p>
            Live eBay prices use eBay’s public listing search (application token). MyVaultExchange does not
            store eBay user account data, and it does not sign buyers into eBay.
          </p>
          <p>
            Payments go through Stripe. Stripe holds card details; MyVaultExchange stores order records
            needed to complete a sale.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
