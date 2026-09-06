import { Footer, Header } from "@/components/Chrome";
import { SellForm } from "@/components/SellForm";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import { Suspense } from "react";

export default async function SellPage() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">Sell</p>
        <h1 className="mt-2 font-serif text-4xl text-money">Open a listing</h1>
        <p className="mt-2 max-w-2xl text-cream/60">
          Scan first if you need an ID, then publish a buy-now or auction into your shop.
        </p>
        <div className="mt-8">
          {user ? (
            <Suspense fallback={<p className="text-cream/50">Loading form…</p>}>
              <SellForm />
            </Suspense>
          ) : (
            <p className="rounded-2xl border border-money/25 bg-queen-deep p-6 text-cream/80">
              Create an account to list. Collection and listings then persist with you.{" "}
              <Link href="/signup" className="text-gold hover:underline">
                Sign up
              </Link>{" "}
              or{" "}
              <Link href="/login" className="text-gold hover:underline">
                log in
              </Link>
              .
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
