import { NextResponse } from "next/server";
import { getItem } from "@/lib/catalog";
import { findListing, payoutAccountId } from "@/lib/connect";
import { appOrigin, applicationFeeCents, getStripe, stripeEnabled, toStripeCents } from "@/lib/stripe";

export async function GET() {
  return NextResponse.json({ enabled: stripeEnabled() });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { listingIds?: string[] };
  const ids = [...new Set(body.listingIds ?? [])];
  const lines = ids
    .map((id) => findListing(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row && row.kind === "buy_now"));

  if (lines.length === 0) {
    return NextResponse.json({ error: "No buy-now listings to check out." }, { status: 400 });
  }

  const origin = await appOrigin(request);
  const destinations = [
    ...new Set(lines.map((row) => payoutAccountId(row)).filter((id): id is string => Boolean(id))),
  ];
  const connectMode =
    destinations.length === 1 && lines.every((row) => payoutAccountId(row) === destinations[0])
      ? "destination"
      : destinations.length > 0
        ? "transfers"
        : "platform";

  const totalCents = lines.reduce((sum, listing) => sum + toStripeCents(listing.price), 0);
  const feeCents = destinations.length > 0 ? applicationFeeCents(totalCents) : 0;
  const transferGroup = `cq-${lines.map((row) => row.id).join("-").slice(0, 80)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      managed_payments: { enabled: false },
      locale: "auto",
      billing_address_collection: "required",
      success_url: `${origin}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        listingIds: lines.map((row) => row.id).join(","),
        connectMode,
      },
      payment_intent_data:
        connectMode === "destination"
          ? {
              application_fee_amount: feeCents,
              transfer_data: { destination: destinations[0] },
              transfer_group: transferGroup,
            }
          : connectMode === "transfers"
            ? { transfer_group: transferGroup }
            : undefined,
      line_items: lines.map((listing) => {
        const item = getItem(listing.catalogId);
        return {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: toStripeCents(listing.price),
            product_data: {
              name: `${item?.shortName ?? listing.catalogId} · ${listing.grade}`,
            },
          },
        };
      }),
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
