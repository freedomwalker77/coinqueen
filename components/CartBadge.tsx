"use client";

import Link from "next/link";
import { useMarket } from "@/lib/localMarket";

export function CartBadge() {
  const { ready, state } = useMarket();
  const count = ready ? state.cart.length : 0;
  return (
    <Link
      href="/cart"
      className="rounded-full px-3 py-1.5 text-cream/75 transition hover:bg-gold/10 hover:text-gold"
    >
      Cart{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
