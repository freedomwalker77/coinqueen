import "server-only";

import type { CatalogItem } from "./catalog";
import type { UserRecord } from "./db";
import { updateUser } from "./db";
import { persistGhlAccount } from "./ghl";

const SELL_SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
].join(" ");

function ebaySandbox() {
  if ((process.env.EBAY_ENV || "").toLowerCase() === "production") return false;
  if ((process.env.EBAY_ENV || "").toLowerCase() === "sandbox") return true;
  const id = process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID || "";
  return /SBX/i.test(id);
}

function ebayApi() {
  return ebaySandbox() ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
}

function ebayAuthHost() {
  return ebaySandbox() ? "https://auth.sandbox.ebay.com" : "https://auth.ebay.com";
}

function ebayMarketplace() {
  const raw = (process.env.EBAY_MARKETPLACE || "EBAY_CA").toUpperCase();
  return raw.startsWith("EBAY_") ? raw : "EBAY_CA";
}

function ebayClient() {
  const id = process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID || "";
  const secret = process.env.EBAY_CLIENT_SECRET || "";
  return { id, secret };
}

export function ebayRuname() {
  return (process.env.EBAY_RUNAME || "").trim();
}

export function ebaySellConfigured() {
  const { id, secret } = ebayClient();
  return Boolean(id && secret && ebayRuname());
}

export function ebayAuthorizeUrl(state: string) {
  const { id } = ebayClient();
  const ruName = ebayRuname();
  const params = new URLSearchParams({
    client_id: id,
    response_type: "code",
    redirect_uri: ruName,
    state,
  });
  return `${ebayAuthHost()}/oauth2/authorize?${params.toString()}&scope=${encodeURIComponent(SELL_SCOPES)}`;
}

async function tokenRequest(body: string) {
  const { id, secret } = ebayClient();
  const response = await fetch(`${ebayApi()}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !json.access_token) {
    return {
      error: json.error_description || json.error || `eBay token failed (${response.status})`,
    };
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expires: Date.now() + (json.expires_in ?? 7200) * 1000,
  };
}

export async function exchangeEbayAuthCode(code: string) {
  return tokenRequest(
    `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(ebayRuname())}`,
  );
}

async function userAccessToken(user: UserRecord) {
  if (user.ebayAccessToken && (user.ebayTokenExpires ?? 0) > Date.now() + 60_000) {
    return user.ebayAccessToken;
  }
  if (!user.ebayRefreshToken) return { error: "Connect eBay on the Sell page first." as const };
  const token = await tokenRequest(
    `grant_type=refresh_token&refresh_token=${encodeURIComponent(user.ebayRefreshToken)}&scope=${encodeURIComponent(SELL_SCOPES)}`,
  );
  if ("error" in token) return token;
  const saved = updateUser(user.id, {
    ebayAccessToken: token.accessToken,
    ebayRefreshToken: token.refreshToken ?? user.ebayRefreshToken,
    ebayTokenExpires: token.expires,
  });
  if (saved) void persistGhlAccount(saved);
  return token.accessToken;
}

async function ebayFetch(token: string, path: string, init?: RequestInit & { marketplace?: string }) {
  const { marketplace: marketplaceOverride, ...rest } = init ?? {};
  const marketplace = marketplaceOverride ?? ebayMarketplace();
  const locale = marketplace === "EBAY_CA" ? "en-CA" : "en-US";
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  headers.set("Accept-Language", locale);
  headers.set("Content-Language", locale);
  headers.set("X-EBAY-C-MARKETPLACE-ID", marketplace);
  if (rest.body) headers.set("Content-Type", "application/json");

  return fetch(`${ebayApi()}${path}`, {
    ...rest,
    method: rest.method || "GET",
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
}

function categoryId(item: CatalogItem) {
  switch (item.category) {
    case "us-coins":
      return "11116";
    case "world-coins":
      return "39482";
    case "ancient":
      return "4734";
    case "us-paper":
    case "world-paper":
      return "40080";
    default:
      return "11116";
  }
}

async function firstPolicyId(
  token: string,
  kind: "fulfillment_policy" | "payment_policy" | "return_policy",
  marketplace: string,
) {
  const response = await ebayFetch(token, `/sell/account/v1/${kind}?marketplace_id=${marketplace}`, {
    marketplace,
  });
  const json = (await response.json()) as Record<
    string,
    Array<{ fulfillmentPolicyId?: string; paymentPolicyId?: string; returnPolicyId?: string }>
  >;
  if (!response.ok) return null;
  const rows = json.fulfillmentPolicies ?? json.paymentPolicies ?? json.returnPolicies ?? [];
  const first = rows[0];
  return first?.fulfillmentPolicyId || first?.paymentPolicyId || first?.returnPolicyId || null;
}

async function policiesFor(token: string, marketplace: string) {
  const [fulfillmentPolicyId, paymentPolicyId, returnPolicyId] = await Promise.all([
    firstPolicyId(token, "fulfillment_policy", marketplace),
    firstPolicyId(token, "payment_policy", marketplace),
    firstPolicyId(token, "return_policy", marketplace),
  ]);
  if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) return null;
  return { fulfillmentPolicyId, paymentPolicyId, returnPolicyId };
}

async function firstLocationKey(token: string, marketplace: string) {
  const response = await ebayFetch(token, "/sell/inventory/v1/location?limit=20", { marketplace });
  const json = (await response.json()) as {
    locations?: Array<{ merchantLocationKey?: string; merchantLocationStatus?: string }>;
  };
  if (!response.ok) return null;
  const enabled = json.locations?.find((row) => row.merchantLocationStatus !== "DISABLED") ?? json.locations?.[0];
  return enabled?.merchantLocationKey ?? null;
}

export async function publishToEbay(input: {
  user: UserRecord;
  sku: string;
  item: CatalogItem;
  grade: string;
  price: number;
  note?: string;
  imageUrl: string;
}) {
  try {
    return await publishToEbayInner(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "eBay request failed.";
    return { error: message };
  }
}

async function publishToEbayInner(input: {
  user: UserRecord;
  sku: string;
  item: CatalogItem;
  grade: string;
  price: number;
  note?: string;
  imageUrl: string;
}) {
  const token = await userAccessToken(input.user);
  if (typeof token !== "string") return token;

  const image = input.imageUrl.trim();
  try {
    const parsed = new URL(image);
    if (parsed.protocol !== "https:") return { error: "eBay needs an https photo URL." as const };
  } catch {
    return { error: "eBay needs a public https photo URL." as const };
  }

  const preferred = ebayMarketplace();
  const marketplaces = preferred === "EBAY_CA" ? ["EBAY_CA", "EBAY_US"] : [preferred, "EBAY_CA", "EBAY_US"];
  const uniqueMarketplaces = [...new Set(marketplaces)];

  let lastError = "eBay could not create an offer on eBay.ca or eBay.com.";
  const sku = `mve${Date.now()}`.slice(0, 50);
  const title = `${input.item.shortName} ${input.grade}`.slice(0, 80);
  const description = [input.item.description, input.note, `Grade: ${input.grade}`, "Listed from MyVaultExchange."]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000);

  for (const marketplace of uniqueMarketplaces) {
    const policies = await policiesFor(token, marketplace);
    if (!policies) {
      lastError = `eBay is missing Payment, Return, or Shipping policies for ${marketplace}.`;
      continue;
    }
    const locationKey = await firstLocationKey(token, marketplace);
    if (!locationKey) {
      lastError = `No eBay inventory location for ${marketplace}. Add a business location in Seller Hub.`;
      continue;
    }

    const itemRes = await ebayFetch(token, `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
      method: "PUT",
      marketplace,
      body: JSON.stringify({
        availability: { shipToLocationAvailability: { quantity: 1 } },
        condition: "USED_EXCELLENT",
        product: {
          title,
          description,
          imageUrls: [image],
        },
      }),
    });
    if (!itemRes.ok) {
      const text = await itemRes.text();
      lastError = `eBay could not save the item on ${marketplace} (${itemRes.status}): ${text.slice(0, 200)}`;
      continue;
    }

    const currency = marketplace === "EBAY_CA" ? "CAD" : "USD";
    const offerRes = await ebayFetch(token, "/sell/inventory/v1/offer", {
      method: "POST",
      marketplace,
      body: JSON.stringify({
        sku,
        marketplaceId: marketplace,
        format: "FIXED_PRICE",
        availableQuantity: 1,
        categoryId: categoryId(input.item),
        listingDescription: description,
        listingPolicies: policies,
        merchantLocationKey: locationKey,
        pricingSummary: {
          price: { value: input.price.toFixed(2), currency },
        },
      }),
    });
    const offerJson = (await offerRes.json()) as { offerId?: string; errors?: Array<{ message?: string }> };
    if (!offerRes.ok || !offerJson.offerId) {
      lastError =
        offerJson.errors?.map((row) => row.message).filter(Boolean).join("; ") ||
        `eBay offer failed on ${marketplace} (${offerRes.status})`;
      continue;
    }

    const pubRes = await ebayFetch(token, `/sell/inventory/v1/offer/${offerJson.offerId}/publish`, {
      method: "POST",
      marketplace,
      body: "{}",
    });
    const pubJson = (await pubRes.json()) as { listingId?: string; errors?: Array<{ message?: string }> };
    if (!pubRes.ok || !pubJson.listingId) {
      lastError =
        pubJson.errors?.map((row) => row.message).filter(Boolean).join("; ") ||
        `eBay publish failed on ${marketplace} (${pubRes.status})`;
      continue;
    }

    const host = marketplace === "EBAY_CA" ? "https://www.ebay.ca" : "https://www.ebay.com";
    return { url: `${host}/itm/${pubJson.listingId}` };
  }

  return { error: lastError };
}
