import { getConnectStatus } from "@/app/actions/connect";
import { Footer, Header } from "@/components/Chrome";
import { ConnectPayouts } from "@/components/ConnectPayouts";
import { SellForm } from "@/components/SellForm";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import { Suspense } from "react";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const user = await getSessionUser();
  const connect = (await searchParams).connect;
  const connectStatus = user ? await getConnectStatus() : null;

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
            <>
              {connectStatus ? (
                <ConnectPayouts initial={connectStatus} returned={connect === "return"} />
              ) : null}
              {connect === "error" ? (
                <p className="mb-6 text-sm text-red-700">
                  Stripe Connect did not finish. Turn on Connect in the Stripe Dashboard (test mode), then try
                  again.
                </p>
              ) : null}
              <Suspense fallback={<p className="text-cream/50">Loading form…</p>}>
                <SellForm />
              </Suspense>
            </>
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
