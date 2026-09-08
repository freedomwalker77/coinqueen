import "server-only";

import type { CatalogItem } from "./catalog";
import type { UserRecord } from "./db";
import { updateUser } from "./db";
import { persistGhlAccount } from "./ghl";
import { EBAY_SELL_SITES, ebaySellSite, isEbaySellSite } from "./ebayMarketplaces";

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

export function defaultEbayMarketplace() {
  const raw = (process.env.EBAY_MARKETPLACE || "EBAY_CA").toUpperCase();
  return isEbaySellSite(raw) ? raw : "EBAY_CA";
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

async function ebayFetch(
  token: string,
  path: string,
  init?: RequestInit & { marketplace?: string; locale?: string },
) {
  const { marketplace: marketplaceOverride, locale: localeOverride, ...rest } = init ?? {};
  const marketplace = marketplaceOverride ?? defaultEbayMarketplace();
  const locale = localeOverride ?? ebaySellSite(marketplace).locale;
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

const treeIds = new Map<string, string>();

function fallbackLeafCategoryId(item: CatalogItem) {
  const text = `${item.name} ${item.series} ${item.denomination} ${item.keywords.join(" ")} ${item.country}`.toLowerCase();
  if (item.category === "ancient") {
    if (text.includes("greek")) return "4738";
    if (text.includes("byzantine")) return "3364";
    if (text.includes("roman")) return "4734";
    return "532";
  }
  if (item.category === "us-paper") {
    if (text.includes("silver certificate")) return "40032";
    if (text.includes("gold certificate")) return "40030";
    if (text.includes("confederate")) return "3414";
    if (text.includes("national")) return "3419";
    return "376";
  }
  if (item.category === "world-paper") {
    if (text.includes("canada")) return "3425";
    return "385";
  }
  if (item.category === "world-coins") {
    if (text.includes("canada")) return "536";
    return "257";
  }
  if (text.includes("wheat")) return "39455";
  if (text.includes("lincoln memorial")) return "31373";
  if (text.includes("morgan")) return "39464";
  if (text.includes("peace dollar")) return "11980";
  if (text.includes("buffalo")) return "139806";
  if (text.includes("indian head") && (text.includes("cent") || text.includes("penny"))) return "41084";
  if (text.includes("mercury")) return "41090";
  if (text.includes("walking liberty")) return "41099";
  if (text.includes("kennedy")) return "41102";
  return "786";
}

async function suggestLeafCategoryId(token: string, marketplace: string, item: CatalogItem) {
  try {
    let treeId = treeIds.get(marketplace);
    if (!treeId) {
      const treeRes = await ebayFetch(
        token,
        `/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${marketplace}`,
        { marketplace },
      );
      const treeJson = (await treeRes.json()) as { categoryTreeId?: string };
      if (!treeRes.ok || !treeJson.categoryTreeId) return fallbackLeafCategoryId(item);
      treeId = treeJson.categoryTreeId;
      treeIds.set(marketplace, treeId);
    }

    const query = [item.year, item.name, item.series, item.country].filter(Boolean).join(" ");
    const sugRes = await ebayFetch(
      token,
      `/commerce/taxonomy/v1/category_tree/${treeId}/get_category_suggestions?q=${encodeURIComponent(query)}`,
      { marketplace },
    );
    const sugJson = (await sugRes.json()) as {
      categorySuggestions?: Array<{ category?: { categoryId?: string } }>;
    };
    return sugJson.categorySuggestions?.[0]?.category?.categoryId || fallbackLeafCategoryId(item);
  } catch {
    return fallbackLeafCategoryId(item);
  }
}

async function firstPolicyId(
  token: string,
  kind: "fulfillment_policy" | "payment_policy" | "return_policy",
  marketplace: string,
) {
  const response = await ebayFetch(token, `/sell/account/v1/${kind}?marketplace_id=${marketplace}`, {
    marketplace,
    locale: "en-US",
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
  const response = await ebayFetch(token, "/sell/inventory/v1/location?limit=20", {
    marketplace,
    locale: "en-US",
  });
  const json = (await response.json()) as {
    locations?: Array<{ merchantLocationKey?: string; merchantLocationStatus?: string }>;
  };
  if (!response.ok) return null;
  const enabled = json.locations?.find((row) => row.merchantLocationStatus !== "DISABLED") ?? json.locations?.[0];
  return enabled?.merchantLocationKey ?? null;
}

async function rememberMarketplace(user: UserRecord, marketplace: string) {
  if (user.ebayMarketplace === marketplace) return;
  const saved = updateUser(user.id, { ebayMarketplace: marketplace });
  if (saved) void persistGhlAccount(saved);
}

async function marketplaceWithPolicies(token: string, preferred: string) {
  const order = [preferred, ...EBAY_SELL_SITES.map((site) => site.id)].filter(
    (id, index, all) => isEbaySellSite(id) && all.indexOf(id) === index,
  );
  for (const marketplace of order) {
    const policies = await policiesFor(token, marketplace);
    if (policies) return { marketplace, policies };
  }
  return null;
}

export async function publishToEbay(input: {
  user: UserRecord;
  sku: string;
  item: CatalogItem;
  grade: string;
  price: number;
  note?: string;
  imageUrl: string;
  marketplace?: string;
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
  marketplace?: string;
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

  const preferred =
    (isEbaySellSite(input.marketplace ?? "") && input.marketplace) ||
    (isEbaySellSite(input.user.ebayMarketplace) && input.user.ebayMarketplace) ||
    defaultEbayMarketplace();
  const chosen = await marketplaceWithPolicies(token, preferred);

  if (!chosen) {
    const site = ebaySellSite(preferred);
    return {
      error: `${site.label} is missing a Payment, Return, or Shipping policy in Seller Hub. Pick the eBay site you sell from, and put worldwide shipping in that site's Shipping policy.`,
    };
  }

  const marketplace = chosen.marketplace;
  const policies = chosen.policies;
  const site = ebaySellSite(marketplace);
  await rememberMarketplace(input.user, marketplace);

  const sku = `mve${Date.now()}`.slice(0, 50);
  const title = `${input.item.shortName} ${input.grade}`.slice(0, 80);
  const description = [input.item.description, input.note, `Grade: ${input.grade}`, "Listed from MyVaultExchange."]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000);

  const locationKey = await firstLocationKey(token, marketplace);
  if (!locationKey) {
    return { error: `No eBay inventory location for ${site.label}. Add a business location in Seller Hub.` };
  }
  const categoryId = await suggestLeafCategoryId(token, marketplace, input.item);

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
    return { error: `eBay could not save the item (${itemRes.status}): ${text.slice(0, 200)}` };
  }

  const offerRes = await ebayFetch(token, "/sell/inventory/v1/offer", {
    method: "POST",
    marketplace,
    body: JSON.stringify({
      sku,
      marketplaceId: marketplace,
      format: "FIXED_PRICE",
      availableQuantity: 1,
        categoryId,
      listingDescription: description,
      listingPolicies: policies,
      merchantLocationKey: locationKey,
      pricingSummary: {
        price: { value: input.price.toFixed(2), currency: site.currency },
      },
    }),
  });
  const offerJson = (await offerRes.json()) as { offerId?: string; errors?: Array<{ message?: string }> };
  if (!offerRes.ok || !offerJson.offerId) {
    return {
      error:
        offerJson.errors?.map((row) => row.message).filter(Boolean).join("; ") ||
        `eBay offer failed (${offerRes.status})`,
    };
  }

  const pubRes = await ebayFetch(token, `/sell/inventory/v1/offer/${offerJson.offerId}/publish`, {
    method: "POST",
    marketplace,
    body: "{}",
  });
  const pubJson = (await pubRes.json()) as { listingId?: string; errors?: Array<{ message?: string }> };
  if (!pubRes.ok || !pubJson.listingId) {
    return {
      error:
        pubJson.errors?.map((row) => row.message).filter(Boolean).join("; ") ||
        `eBay publish failed (${pubRes.status})`,
    };
  }

  return { url: `${site.host}/itm/${pubJson.listingId}` };
}
