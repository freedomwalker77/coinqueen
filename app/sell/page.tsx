import { Footer, Header } from "@/components/Chrome";
import { SellForm } from "@/components/SellForm";
import { Suspense } from "react";

export default function SellPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Sell</p>
        <h1 className="mt-2 font-serif text-4xl text-cream">Open a listing</h1>
        <p className="mt-2 max-w-2xl text-cream/60">
          Scan first if you need an ID, then publish a buy-now or auction into your shop on this
          device.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-cream/50">Loading form…</p>}>
            <SellForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
