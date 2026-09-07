import "server-only";

import { headers } from "next/headers";
import Stripe from "stripe";

export { PLATFORM_FEE_BPS, applicationFeeCents, sellerPayoutCents } from "./stripeFee";

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function toStripeCents(usd: number) {
  return Math.max(50, Math.round(usd * 100));
}

export async function appOrigin(request?: Request) {
  if (request) {
    const fromHeader = request.headers.get("origin");
    if (fromHeader) return fromHeader;
  }
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (host) {
    const proto = list.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
