import { Footer, Header } from "@/components/Chrome";
import { Scanner } from "@/components/Scanner";

export default function ScanPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">AI scanner</p>
        <h1 className="mt-2 font-serif text-4xl text-money">Identify & price</h1>
        <p className="mt-2 max-w-2xl text-cream/70">
          Snap a coin or note. We match it to the catalog and show what it last sold for on eBay and
          Heritage Auctions.
        </p>
        <div className="mt-8">
          <Scanner />
        </div>
      </main>
      <Footer />
    </div>
  );
}
