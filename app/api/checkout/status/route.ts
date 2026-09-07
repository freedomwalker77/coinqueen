import { NextResponse } from "next/server";
import { fulfillSellerPayouts } from "@/lib/connect";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ paid: false, error: "Stripe is not configured." }, { status: 503 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ paid: false, error: "Missing session." }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = session.payment_status === "paid" || session.status === "complete";
  const listingIds = (session.metadata?.listingIds ?? "").split(",").filter(Boolean);

  let payouts: Awaited<ReturnType<typeof fulfillSellerPayouts>> = [];
  if (paid) {
    try {
      payouts = await fulfillSellerPayouts(sessionId);
    } catch {
      payouts = [];
    }
  }

  return NextResponse.json({
    paid,
    listingIds,
    amountTotal: session.amount_total,
    connectMode: session.metadata?.connectMode ?? "platform",
    payouts,
  });
}
