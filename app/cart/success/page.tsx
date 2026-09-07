"use client";

import { Footer, Header } from "@/components/Chrome";
import { useMarket } from "@/lib/localMarket";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SuccessBody() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const { ready, checkout } = useMarket();
  const [status, setStatus] = useState<"wait" | "ok" | "fail">("wait");
  const [message, setMessage] = useState("Confirming payment…");

  useEffect(() => {
    if (!ready || !sessionId) return;
    let cancelled = false;
    async function confirm() {
      const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId ?? "")}`);
      const json = (await response.json()) as {
        paid?: boolean;
        listingIds?: string[];
        error?: string;
        payouts?: { listingId: string }[];
      };
      if (cancelled) return;
      if (!response.ok || !json.paid) {
        setStatus("fail");
        setMessage(json.error || "Payment was not completed.");
        return;
      }
      const order = checkout(json.listingIds);
      setStatus("ok");
      setMessage(
        order
          ? `Order ${order.id} is recorded. Thank you.${json.payouts?.length ? " Connected sellers were paid their share (minus MyVaultExchange’s 10%)." : ""}`
          : "Payment received. Listings were already cleared.",
      );
    }
    void confirm().catch(() => {
      if (!cancelled) {
        setStatus("fail");
        setMessage("Could not confirm the Stripe session.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, sessionId, checkout]);

  return (
    <div className="rounded-2xl border border-money/20 bg-queen-deep p-6">
      <p className={status === "fail" ? "text-red-700" : "text-cream"}>{message}</p>
      <Link href="/market" className="mt-4 inline-block text-gold hover:underline">
        Back to market
      </Link>
    </div>
  );
}

export default function CartSuccessPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">Cart</p>
        <h1 className="mt-2 font-serif text-4xl text-money">Payment</h1>
        <div className="mt-8">
          <Suspense fallback={<p className="text-cream/55">Loading…</p>}>
            <SuccessBody />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
