import "server-only";

import type { CatalogItem, Category, Comp } from "./catalog";
import { EBAY_SOLD, HERITAGE, type CompFeed } from "./comps";
import { parseJsonArray, visionComplete, visionConfigured } from "./gemini";

export type { CompFeed };

const EBAY_FINDING_PROD = "https://svcs.ebay.com/services/search/FindingService/v1";
const EBAY_FINDING_SBX = "https://svcs.sandbox.ebay.com/services/search/FindingService/v1";

function ebaySandbox() {
  if ((process.env.EBAY_ENV || "").toLowerCase() === "production") return false;
  if ((process.env.EBAY_ENV || "").toLowerCase() === "sandbox") return true;
  const id = process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID || "";
  return /SBX/i.test(id);
}

function ebayHosts() {
  if (ebaySandbox()) {
    return {
      oauth: "https://api.sandbox.ebay.com/identity/v1/oauth2/token",
      browse: "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search",
      finding: EBAY_FINDING_SBX,
    };
  }
  return {
    oauth: "https://api.ebay.com/identity/v1/oauth2/token",
    browse: "https://api.ebay.com/buy/browse/v1/item_summary/search",
    finding: EBAY_FINDING_PROD,
  };
}

function ebayMarketplace() {
  const raw = (process.env.EBAY_MARKETPLACE || "EBAY_CA").toUpperCase();
  return raw.startsWith("EBAY_") ? raw : "EBAY_CA";
}

function ebayFindingGlobalId() {
  return ebayMarketplace() === "EBAY_CA" ? "EBAY-ENCA" : "EBAY-US";
}

let ebayToken: { value: string; expires: number } | null = null;

function categoryId(category: Category) {
  switch (category) {
    case "us-coins":
      return "39482";
    case "world-coins":
      return "4737";
    case "ancient":
      return "4734";
    case "us-paper":
    case "world-paper":
      return "40080";
    default:
      return "11116";
  }
}

export function compsQuery(item: CatalogItem, visionQuery?: string) {
  const extra = visionQuery?.trim();
  if (extra && extra.length >= 6) return extra;
  return [item.year, item.shortName].filter(Boolean).join(" ").trim() || item.name;
}

export function marketQueryFromVision(vision?: {
  year?: string;
  name?: string;
  denomination?: string;
  series?: string;
  country?: string;
}) {
  if (!vision) return "";
  return [vision.year, vision.name, vision.denomination, vision.series, vision.country]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function ebaySearchUrl(item: CatalogItem, sold: boolean, query?: string) {
  const params = new URLSearchParams({
    _nkw: compsQuery(item, query),
    _sacat: categoryId(item.category),
    rt: "nc",
  });
  if (sold) {
    params.set("LH_Sold", "1");
    params.set("LH_Complete", "1");
  }
  return `https://www.ebay.ca/sch/i.html?${params.toString()}`;
}

export function ebaySoldSearchUrl(item: CatalogItem, query?: string) {
  return ebaySearchUrl(item, true, query);
}

export function ebayListedSearchUrl(item: CatalogItem, query?: string) {
  return ebaySearchUrl(item, false, query);
}

export function heritageSearchUrl(item: CatalogItem, query?: string) {
  const host = item.type === "note" ? "currency.ha.com" : "coins.ha.com";
  const params = new URLSearchParams({ Ntt: compsQuery(item, query) });
  return `https://${host}/c/search-results.zx?${params.toString()}`;
}

function gradeFromTitle(title: string) {
  const certified = title.match(
    /\b(?:PCGS|NGC|PMG|ANACS|ICG)\s*(AU|MS|PF|PR|XF|EF|VF|F|VG|G)[-\s]?(\d{1,2}(?:\.\d)?)/i,
  );
  if (certified) return `${certified[1].toUpperCase()}-${certified[2]}`;
  const slab = title.match(/\b(MS|PF|PR|AU|XF|EF|VF)[-\s]?(\d{1,2})\b/i);
  if (slab) return `${slab[1].toUpperCase()}-${slab[2]}`;
  return "Ungraded";
}

function money(value: unknown) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

async function ebayAccessToken() {
  const id = process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (ebayToken && ebayToken.expires > Date.now() + 60_000) return ebayToken.value;

  const hosts = ebayHosts();
  const response = await fetch(hosts.oauth, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent("https://api.ebay.com/oauth/api_scope")}`,
    cache: "no-store",
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  ebayToken = { value: json.access_token, expires: Date.now() + (json.expires_in ?? 7200) * 1000 };
  return ebayToken.value;
}

async function fetchEbaySold(item: CatalogItem, query?: string): Promise<Comp[]> {
  const app = process.env.EBAY_APP_ID || process.env.EBAY_CLIENT_ID;
  if (!app) return [];
  const params = new URLSearchParams({
    "OPERATION-NAME": "findCompletedItems",
    "SERVICE-VERSION": "1.13.0",
    "SECURITY-APPNAME": app,
    "GLOBAL-ID": ebayFindingGlobalId(),
    "RESPONSE-DATA-FORMAT": "JSON",
    "REST-PAYLOAD": "true",
    keywords: compsQuery(item, query),
    "paginationInput.entriesPerPage": "8",
    sortOrder: "EndTimeSoonest",
    "itemFilter(0).name": "SoldItemsOnly",
    "itemFilter(0).value": "true",
    "itemFilter(1).name": "CategoryId",
    "itemFilter(1).value": categoryId(item.category),
  });
  const response = await fetch(`${ebayHosts().finding}?${params.toString()}`, {
    next: { revalidate: 1800 },
  });
  if (!response.ok) return [];
  const json = (await response.json()) as {
    findCompletedItemsResponse?: Array<{
      ack?: string[];
      searchResult?: Array<{ item?: EbayFindingItem[] }>;
    }>;
  };
  const ack = json.findCompletedItemsResponse?.[0]?.ack?.[0];
  if (ack && ack !== "Success" && ack !== "Warning") return [];
  const items = json.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item ?? [];
  const rows: Comp[] = [];
  for (const row of items) {
    const price = money(row.sellingStatus?.[0]?.currentPrice?.[0]?.__value__);
    const title = row.title?.[0] ?? "";
    const date = (row.listingInfo?.[0]?.endTime?.[0] ?? "").slice(0, 10);
    if (!price || !date) continue;
    rows.push({
      date,
      venue: EBAY_SOLD,
      grade: row.condition?.[0]?.conditionDisplayName?.[0] || gradeFromTitle(title),
      price,
      kind: "sold",
      url: row.viewItemURL?.[0],
      title,
      imageUrl: row.galleryURL?.[0],
      seller: row.sellerInfo?.[0]?.sellerUserName?.[0],
    });
  }
  return rows;
}

type EbayFindingItem = {
  title?: string[];
  viewItemURL?: string[];
  galleryURL?: string[];
  listingInfo?: Array<{ endTime?: string[] }>;
  sellingStatus?: Array<{ currentPrice?: Array<{ __value__?: string }> }>;
  condition?: Array<{ conditionDisplayName?: string[] }>;
  sellerInfo?: Array<{ sellerUserName?: string[] }>;
};

async function fetchEbayListed(item: CatalogItem, query?: string): Promise<Comp[]> {
  const token = await ebayAccessToken();
  if (!token) return [];
  const params = new URLSearchParams({
    q: compsQuery(item, query),
    limit: "8",
    sort: "newlyListed",
    fieldgroups: "EXTENDED",
  });
  const response = await fetch(`${ebayHosts().browse}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": ebayMarketplace(),
    },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const json = (await response.json()) as {
    itemSummaries?: Array<{
      title?: string;
      condition?: string;
      itemWebUrl?: string;
      price?: { value?: string };
      itemCreationDate?: string;
      shortDescription?: string;
      image?: { imageUrl?: string };
      thumbnailImages?: Array<{ imageUrl?: string }>;
      additionalImages?: Array<{ imageUrl?: string }>;
      seller?: { username?: string };
    }>;
  };
  const rows: Comp[] = [];
  for (const row of json.itemSummaries ?? []) {
    const price = money(row.price?.value);
    if (!price) continue;
    rows.push({
      date: (row.itemCreationDate ?? new Date().toISOString()).slice(0, 10),
      venue: "eBay listing",
      grade: row.condition || gradeFromTitle(row.title ?? ""),
      price,
      kind: "listed",
      url: row.itemWebUrl,
      title: row.title,
      imageUrl:
        row.image?.imageUrl || row.thumbnailImages?.[0]?.imageUrl || row.additionalImages?.[0]?.imageUrl,
      seller: row.seller?.username,
      details: row.shortDescription,
    });
  }
  return rows;
}

function sampleRows(item: CatalogItem, ebay: boolean) {
  return item.comps
    .filter((comp) => (ebay ? /ebay/i.test(comp.venue) : !/ebay/i.test(comp.venue)))
    .map((comp) => ({
      ...comp,
      title: item.name,
      catalogId: item.id,
    }));
}

function ebayItemUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (!/(^|\.)ebay\.(com|ca|co\.uk|de|com\.au|fr|it|es)$/i.test(url.hostname)) return "";
    const match = url.pathname.match(/\/itm\/(?:[\w-]+\/)?(\d{9,15})/i);
    if (!match) return "";
    return `${url.protocol}//${url.hostname}/itm/${match[1]}`;
  } catch {
    return "";
  }
}

function httpImage(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

async function fetchEbayListedFromSearch(query: string): Promise<Comp[]> {
  if (!visionConfigured() || query.trim().length < 4) return [];
  const prompt = `Use Google Search to find CURRENT eBay listings for sale matching: ${query}
Prefer ebay.com and ebay.ca item pages (/itm/ with a numeric item id).
Return ONLY a JSON array of up to 6 real listings, no markdown. Objects:
{"title":"","price":0,"url":"","imageUrl":"","seller":"","grade":""}
price is a number in USD (approximate if the listing is CAD).
imageUrl must be the listing photo if search shows a thumbnail (often i.ebayimg.com). Empty string if unknown.
Do not invent item ids.`;

  try {
    const text = await visionComplete({ prompt, webSearch: true });
    const rows: Comp[] = [];
    const seen = new Set<string>();
    for (const row of parseJsonArray<{
      title?: string;
      price?: number | string;
      url?: string;
      imageUrl?: string;
      seller?: string;
      grade?: string;
    }>(text)) {
      const url = ebayItemUrl(String(row.url ?? ""));
      const price = money(row.price);
      if (!url || !price || seen.has(url)) continue;
      seen.add(url);
      const title = String(row.title ?? "").trim() || query;
      rows.push({
        date: new Date().toISOString().slice(0, 10),
        venue: "eBay listing",
        grade: String(row.grade ?? "").trim() || gradeFromTitle(title),
        price,
        kind: "listed",
        url,
        title,
        imageUrl: httpImage(String(row.imageUrl ?? "")) || undefined,
        seller: String(row.seller ?? "").trim() || undefined,
      });
    }
    return rows;
  } catch {
    return [];
  }
}

export type LiveCompOptions = {
  query?: string;
  webSearch?: boolean;
};

export async function liveEbayFeed(item: CatalogItem, query?: string): Promise<CompFeed> {
  const searchUrl = ebaySoldSearchUrl(item, query);
  try {
    const sold = await fetchEbaySold(item, query);
    if (sold.length > 0) return { rows: sold, mode: "sold", searchUrl };
  } catch {
    /* fall through to catalog samples */
  }
  return { rows: sampleRows(item, true), mode: "sample", searchUrl };
}

export async function liveEbayForSaleFeed(
  item: CatalogItem,
  options: LiveCompOptions = {},
): Promise<CompFeed> {
  const searchUrl = ebayListedSearchUrl(item, options.query);
  try {
    const listed = await fetchEbayListed(item, options.query);
    if (listed.length > 0) return { rows: listed, mode: "listed", searchUrl };
  } catch {
    /* fall through */
  }
  if (options.webSearch) {
    const web = await fetchEbayListedFromSearch(compsQuery(item, options.query));
    if (web.length > 0) return { rows: web, mode: "listed", searchUrl };
  }
  return { rows: [], mode: "listed", searchUrl };
}

export async function liveHeritageFeed(item: CatalogItem, query?: string): Promise<CompFeed> {
  return {
    rows: sampleRows(item, false),
    mode: "sample",
    searchUrl: heritageSearchUrl(item, query),
  };
}

export async function liveComps(item: CatalogItem, options: LiveCompOptions = {}) {
  const [ebay, heritage, forSale] = await Promise.all([
    liveEbayFeed(item, options.query),
    liveHeritageFeed(item, options.query),
    liveEbayForSaleFeed(item, options),
  ]);
  return { ebay, heritage, forSale };
}
