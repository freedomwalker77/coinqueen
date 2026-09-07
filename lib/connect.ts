import "server-only";

import type { ConnectStatus } from "./definitions";
import { isConnectCountry, stripeCountryParam } from "./countries";
import { findUserByShopSlug, loadAllUserListings, updateUser, type UserRecord } from "./db";
import { SEED_LISTINGS, type Listing } from "./market";
import { appOrigin, getStripe, toStripeCents } from "./stripe";
import { sellerPayoutCents } from "./stripeFee";

export type { ConnectStatus };

export function findListing(id: string) {
  return SEED_LISTINGS.find((row) => row.id === id) ?? loadAllUserListings().find((row) => row.id === id);
}

export function sellerForListing(listing: Listing) {
  return findUserByShopSlug(listing.shopSlug) ?? null;
}

export function payoutAccountId(listing: Listing) {
  const seller = sellerForListing(listing);
  if (seller?.stripeAccountId && seller.stripeChargesEnabled) return seller.stripeAccountId;
  return null;
}

function connectReady(account: {
  configuration?: {
    merchant?: {
      capabilities?: {
        card_payments?: { status?: string };
      };
    };
    recipient?: {
      capabilities?: {
        stripe_balance?: {
          stripe_transfers?: { status?: string };
          payouts?: { status?: string };
        };
      };
    };
  };
}) {
  const transfers = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status;
  const cards = account.configuration?.merchant?.capabilities?.card_payments?.status;
  const payouts = account.configuration?.recipient?.capabilities?.stripe_balance?.payouts?.status;
  return {
    chargesEnabled: transfers === "active" || cards === "active",
    payoutsEnabled: payouts === "active",
  };
}

const CONNECT_INCLUDE = [
  "configuration.merchant",
  "configuration.recipient",
  "defaults",
  "identity",
] as const;

const CONNECT_CONFIGURATION = {
  merchant: {
    capabilities: {
      card_payments: { requested: true },
    },
  },
  recipient: {
    capabilities: {
      stripe_balance: {
        stripe_transfers: { requested: true },
      },
    },
  },
} as const;

export async function refreshConnectAccount(user: UserRecord): Promise<ConnectStatus> {
  const stripe = getStripe();
  if (!stripe) {
    return { enabled: false, accountId: null, chargesEnabled: false, payoutsEnabled: false, country: null };
  }
  if (!user.stripeAccountId) {
    return {
      enabled: true,
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      country: user.country ?? null,
    };
  }

  const account = await stripe.v2.core.accounts.retrieve(user.stripeAccountId, {
    include: [...CONNECT_INCLUDE],
  });
  const flags = connectReady(account);
  const identityCountry = account.identity?.country?.toUpperCase();
  updateUser(user.id, {
    stripeChargesEnabled: flags.chargesEnabled,
    stripePayoutsEnabled: flags.payoutsEnabled,
    ...(identityCountry ? { country: identityCountry } : {}),
  });
  return {
    enabled: true,
    accountId: account.id,
    chargesEnabled: flags.chargesEnabled,
    payoutsEnabled: flags.payoutsEnabled,
    country: identityCountry ?? user.country ?? null,
  };
}

export async function createConnectOnboardingUrl(user: UserRecord) {
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe is not configured." as const };

  let accountId = user.stripeAccountId;
  if (!accountId) {
    const country = user.country ? stripeCountryParam(user.country) : "";
    if (!isConnectCountry(country)) {
      return { error: "Choose the country where you bank before connecting Stripe." as const };
    }
    const account = await stripe.v2.core.accounts.create({
      display_name: user.name,
      contact_email: user.email,
      dashboard: "express",
      identity: {
        country,
        entity_type: "individual",
      },
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      configuration: CONNECT_CONFIGURATION,
      metadata: { mveUserId: user.id, shopSlug: user.shopSlug },
      include: [...CONNECT_INCLUDE],
    });
    accountId = account.id;
    const flags = connectReady(account);
    updateUser(user.id, {
      stripeAccountId: accountId,
      stripeChargesEnabled: flags.chargesEnabled,
      stripePayoutsEnabled: flags.payoutsEnabled,
    });
  } else {
    await stripe.v2.core.accounts.update(accountId, {
      configuration: CONNECT_CONFIGURATION,
    });
  }

  const origin = await appOrigin();
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["merchant", "recipient"],
        refresh_url: `${origin}/api/connect/refresh`,
        return_url: `${origin}/sell?connect=return`,
      },
    },
  });
  if (!link.url) return { error: "Stripe did not return an onboarding URL." as const };
  return { url: link.url };
}

export async function createConnectDashboardUrl(accountId: string) {
  const stripe = getStripe();
  if (!stripe) return null;
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

export type PayoutResult = {
  listingId: string;
  destination: string;
  amountCents: number;
};

export async function fulfillSellerPayouts(sessionId: string): Promise<PayoutResult[]> {
  const stripe = getStripe();
  if (!stripe) return [];

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = session.payment_status === "paid" || session.status === "complete";
  if (!paid) return [];

  const listingIds = (session.metadata?.listingIds ?? "").split(",").filter(Boolean);
  const results: PayoutResult[] = [];

  if (session.metadata?.connectMode === "destination") {
    const listing = listingIds.map(findListing).find(Boolean);
    const destination = listing ? payoutAccountId(listing) : null;
    if (destination && listing) {
      results.push({
        listingId: listing.id,
        destination,
        amountCents: sellerPayoutCents(toStripeCents(listing.price)),
      });
    }
    return results;
  }

  const byAccount = new Map<string, { listingIds: string[]; cents: number }>();
  for (const id of listingIds) {
    const listing = findListing(id);
    if (!listing || listing.kind !== "buy_now") continue;
    const destination = payoutAccountId(listing);
    if (!destination) continue;
    const cents = sellerPayoutCents(toStripeCents(listing.price));
    const row = byAccount.get(destination) ?? { listingIds: [], cents: 0 };
    row.listingIds.push(id);
    row.cents += cents;
    byAccount.set(destination, row);
  }

  for (const [destination, row] of byAccount) {
    if (row.cents < 1) continue;
    await stripe.transfers.create(
      {
        amount: row.cents,
        currency: "usd",
        destination,
        transfer_group: session.id,
        metadata: { listingIds: row.listingIds.join(","), checkoutSession: session.id },
      },
      { idempotencyKey: `cq-xfer-${session.id}-${destination}` },
    );
    for (const listingId of row.listingIds) {
      const listing = findListing(listingId);
      results.push({
        listingId,
        destination,
        amountCents: listing ? sellerPayoutCents(toStripeCents(listing.price)) : 0,
      });
    }
  }

  return results;
}
