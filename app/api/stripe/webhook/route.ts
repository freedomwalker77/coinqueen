import { NextResponse } from "next/server";
import {
  applyEbayPlanCheckoutSession,
  saveEbayPlanFromSubscription,
} from "@/lib/ebayPlan";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (session.mode === "subscription" && session.metadata?.kind === "ebay_plan" && userId) {
        await applyEbayPlanCheckoutSession(session.id, userId);
      }
    }
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await saveEbayPlanFromSubscription(event.data.object);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
