import "server-only";

import Stripe from "stripe";
import { persistGhlAccount } from "@/lib/ghl";
import { findUserById, findUserByStripeCustomerId, updateUser, type UserRecord } from "@/lib/db";
import { appOrigin, getStripe, stripeEnabled } from "@/lib/stripe";

export const EBAY_PLAN_CENTS = 1497;
export const EBAY_PLAN_LABEL = "Also list on eBay";

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export function ebayPlanPriceId() {
  return process.env.STRIPE_EBAY_PRICE_ID?.trim() || "";
}

export function isEbayPlanActive(user: Pick<UserRecord, "ebayPlanStatus"> | null | undefined) {
  return Boolean(user?.ebayPlanStatus && ACTIVE.has(user.ebayPlanStatus));
}

function periodEnd(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return item?.current_period_end ?? 0;
}

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!value) return "";
  return typeof value === "string" ? value : value.id;
}

export async function saveEbayPlanFromSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const customer = customerId(sub.customer);
  const user = (userId ? findUserById(userId) : undefined) ?? findUserByStripeCustomerId(customer);
  if (!user) return null;
  const saved = updateUser(user.id, {
    stripeCustomerId: customer || user.stripeCustomerId,
    ebayPlanSubscriptionId: sub.id,
    ebayPlanStatus: sub.status,
    ebayPlanPeriodEnd: periodEnd(sub),
  });
  if (saved) void persistGhlAccount(saved);
  return saved;
}

export async function applyEbayPlanCheckoutSession(sessionId: string, expectedUserId: string) {
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe is not configured." as const };
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  if (session.mode !== "subscription") return { error: "Not a subscription checkout." as const };
  if (session.metadata?.kind !== "ebay_plan") return { error: "Wrong checkout session." as const };
  if (session.metadata.userId !== expectedUserId) return { error: "This checkout belongs to another account." as const };
  const raw = session.subscription;
  const sub =
    typeof raw === "string"
      ? await stripe.subscriptions.retrieve(raw)
      : raw;
  if (!sub) return { error: "Stripe did not return a subscription yet." as const };
  const saved = await saveEbayPlanFromSubscription(sub);
  return saved ? { ok: true as const, subscribed: isEbayPlanActive(saved) } : { error: "Account not found." as const };
}

export async function refreshEbayPlan(user: UserRecord) {
  const stripe = getStripe();
  if (!stripe || !user.ebayPlanSubscriptionId) {
    return {
      enabled: stripeEnabled(),
      subscribed: isEbayPlanActive(user),
      status: user.ebayPlanStatus ?? null,
      periodEnd: user.ebayPlanPeriodEnd ?? null,
    };
  }
  try {
    const sub = await stripe.subscriptions.retrieve(user.ebayPlanSubscriptionId);
    const saved = (await saveEbayPlanFromSubscription(sub)) ?? user;
    return {
      enabled: true,
      subscribed: isEbayPlanActive(saved),
      status: saved.ebayPlanStatus ?? sub.status,
      periodEnd: saved.ebayPlanPeriodEnd ?? periodEnd(sub),
    };
  } catch {
    return {
      enabled: stripeEnabled(),
      subscribed: isEbayPlanActive(user),
      status: user.ebayPlanStatus ?? null,
      periodEnd: user.ebayPlanPeriodEnd ?? null,
    };
  }
}

export async function createEbayPlanCheckoutUrl(user: UserRecord) {
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe is not configured." as const };
  const origin = await appOrigin();
  const priceId = ebayPlanPriceId();
  const lineItems = priceId
    ? [{ quantity: 1, price: priceId }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: "usd" as const,
            unit_amount: EBAY_PLAN_CENTS,
            recurring: { interval: "month" as const },
            product_data: {
              name: EBAY_PLAN_LABEL,
              description: "Cross-post MyVaultExchange lots to your eBay account.",
              tax_code: "txcd_10103000",
            },
          },
        },
      ];
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    managed_payments: { enabled: false },
    locale: "auto",
    billing_address_collection: "required",
    success_url: `${origin}/sell?ebay_plan=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/sell?ebay_plan=cancel`,
    client_reference_id: user.id,
    customer: user.stripeCustomerId || undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    metadata: { kind: "ebay_plan", userId: user.id },
    subscription_data: {
      metadata: { kind: "ebay_plan", userId: user.id },
    },
    line_items: lineItems,
  });
  if (!session.url) return { error: "Stripe did not return a checkout URL." as const };
  return { url: session.url };
}

export async function createEbayPlanPortalUrl(user: UserRecord) {
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe is not configured." as const };
  if (!user.stripeCustomerId) return { error: "Subscribe first, then you can manage billing." as const };
  const origin = await appOrigin();
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/sell`,
  });
  return { url: portal.url };
}
