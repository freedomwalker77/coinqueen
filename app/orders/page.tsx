"use client";

import { AccountScreen, SignInGate } from "@/components/AccountScreen";
import { formatMoney } from "@/lib/catalog";
import { useMarket } from "@/lib/localMarket";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OrdersBody() {
  const params = useSearchParams();
  const seller = params.get("role") === "seller";
  const { ready, account, state } = useMarket();

  if (!ready) {
    return (
      <AccountScreen eyebrow="Account" title="Orders" blurb="Buys and sales on this account.">
        <p className="text-cream/50">Loading…</p>
      </AccountScreen>
    );
  }
  if (!account) {
    return (
      <AccountScreen eyebrow="Account" title="Orders" blurb="Buys and sales on this account.">
        <SignInGate />
      </AccountScreen>
    );
  }

  return (
    <AccountScreen
      eyebrow="Account"
      title={seller ? "Seller orders" : "My orders"}
      blurb={
        seller
          ? "When a buyer pays a lot from your shop, it shows here."
          : "Lots you checked out on MyVaultExchange."
      }
    >
      {state.orders.length === 0 ? (
        <p className="text-cream/55">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {state.orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-money/20 bg-queen-deep px-4 py-3">
              <p className="font-medium text-queen-ink">{order.id}</p>
              <p className="text-sm text-cream/55">
                {formatMoney(order.total)} · {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                {order.listingIds.length} lot{order.listingIds.length === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AccountScreen>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="p-10 text-cream/50">Loading…</p>}>
      <OrdersBody />
    </Suspense>
  );
}
