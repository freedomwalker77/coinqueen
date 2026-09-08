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

function contentLanguage() {
  return ebayMarketplace() === "EBAY_CA" ? "en-CA" : "en-US";
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
    scope: SELL_SCOPES,
    state,
  });
  return `${ebayAuthHost()}/oauth2/authorize?${params.toString()}`;
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

async function ebayFetch(token: string, path: string, init?: RequestInit) {
  return fetch(`${ebayApi()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Language": contentLanguage(),
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
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

async function firstPolicyId(token: string, kind: "fulfillment_policy" | "payment_policy" | "return_policy") {
  const marketplace = ebayMarketplace();
  const response = await ebayFetch(token, `/sell/account/v1/${kind}?marketplace_id=${marketplace}`);
  const json = (await response.json()) as Record<string, Array<{ fulfillmentPolicyId?: string; paymentPolicyId?: string; returnPolicyId?: string }>>;
  if (!response.ok) return null;
  const rows =
    json.fulfillmentPolicies ?? json.paymentPolicies ?? json.returnPolicies ?? [];
  const first = rows[0];
  return first?.fulfillmentPolicyId || first?.paymentPolicyId || first?.returnPolicyId || null;
}

async function firstLocationKey(token: string) {
  const response = await ebayFetch(token, "/sell/inventory/v1/location?limit=20");
  const json = (await response.json()) as { locations?: Array<{ merchantLocationKey?: string }> };
  if (!response.ok) return null;
  return json.locations?.[0]?.merchantLocationKey ?? null;
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
  const token = await userAccessToken(input.user);
  if (typeof token !== "string") return token;

  const image = input.imageUrl.trim();
  try {
    const parsed = new URL(image);
    if (parsed.protocol !== "https:") return { error: "eBay needs an https photo URL." as const };
  } catch {
    return { error: "eBay needs a public https photo URL." as const };
  }

  const locationKey = await firstLocationKey(token);
  if (!locationKey) {
    return {
      error:
        "No eBay inventory location yet. In Seller Hub, add a business location (or create an inventory location), then try again.",
    } as const;
  }
  const fulfillmentPolicyId = await firstPolicyId(token, "fulfillment_policy");
  const paymentPolicyId = await firstPolicyId(token, "payment_policy");
  const returnPolicyId = await firstPolicyId(token, "return_policy");
  if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
    return {
      error:
        "eBay is missing Payment, Return, or Shipping (fulfillment) policies. Create them in Seller Hub for this marketplace, then retry.",
    } as const;
  }

  const sku = input.sku.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50) || `mve-${Date.now()}`;
  const title = `${input.item.shortName} ${input.grade}`.slice(0, 80);
  const description = [input.item.description, input.note, `Grade: ${input.grade}`, "Listed from MyVaultExchange."]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000);

  const itemRes = await ebayFetch(token, `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    method: "PUT",
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
    return { error: `eBay inventory failed (${itemRes.status}): ${text.slice(0, 240)}` as const };
  }

  const offerRes = await ebayFetch(token, "/sell/inventory/v1/offer", {
    method: "POST",
    body: JSON.stringify({
      sku,
      marketplaceId: ebayMarketplace(),
      format: "FIXED_PRICE",
      availableQuantity: 1,
      categoryId: categoryId(input.item),
      listingDescription: description,
      listingPolicies: {
        fulfillmentPolicyId,
        paymentPolicyId,
        returnPolicyId,
      },
      merchantLocationKey: locationKey,
      pricingSummary: {
        price: { value: input.price.toFixed(2), currency: "USD" },
      },
    }),
  });
  const offerJson = (await offerRes.json()) as { offerId?: string; errors?: Array<{ message?: string }> };
  if (!offerRes.ok || !offerJson.offerId) {
    const message = offerJson.errors?.map((row) => row.message).filter(Boolean).join("; ") || `eBay offer failed (${offerRes.status})`;
    return { error: message as string };
  }

  const pubRes = await ebayFetch(token, `/sell/inventory/v1/offer/${offerJson.offerId}/publish`, {
    method: "POST",
    body: "{}",
  });
  const pubJson = (await pubRes.json()) as { listingId?: string; errors?: Array<{ message?: string }> };
  if (!pubRes.ok || !pubJson.listingId) {
    const message = pubJson.errors?.map((row) => row.message).filter(Boolean).join("; ") || `eBay publish failed (${pubRes.status})`;
    return { error: message as string };
  }

  const host = ebayMarketplace() === "EBAY_CA" ? "https://www.ebay.ca" : "https://www.ebay.com";
  return { url: `${host}/itm/${pubJson.listingId}` };
}
