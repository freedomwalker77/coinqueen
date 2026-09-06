import { Footer, Header } from "@/components/Chrome";
import { Scanner } from "@/components/Scanner";

export default function ScanPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">AI scanner</p>
        <h1 className="mt-2 font-serif text-4xl text-cream">Identify & price</h1>
        <p className="mt-2 max-w-2xl text-cream/60">
          Card Price King scans a card and pulls TCG/eBay comps. CoinQueen does the same job for metal
          and paper: identify the issue, then show what the market actually paid.
        </p>
        <div className="mt-8">
          <Scanner />
        </div>
      </main>
      <Footer />
    </div>
  );
}
