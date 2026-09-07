import { NextResponse } from "next/server";

function ebaySandbox() {
  if ((process.env.EBAY_ENV || "").toLowerCase() === "production") return false;
  if ((process.env.EBAY_ENV || "").toLowerCase() === "sandbox") return true;
  const id = process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID || "";
  return /SBX/i.test(id);
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { parseError: text.slice(0, 120) };
  }
}

export async function GET() {
  const id = process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  const marketplace = process.env.EBAY_MARKETPLACE || "EBAY_CA";
  const sandbox = ebaySandbox();
  const oauthUrl = sandbox
    ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    : "https://api.ebay.com/identity/v1/oauth2/token";
  const browseUrl = sandbox
    ? "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search"
    : "https://api.ebay.com/buy/browse/v1/item_summary/search";

  if (!id || !secret) {
    return NextResponse.json({ configured: false, tokenOk: false, listedCount: 0, sandbox });
  }

  const oauth = await fetch(oauthUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent("https://api.ebay.com/oauth/api_scope")}`,
    cache: "no-store",
  });
  const oauthJson = await readJson(oauth);
  const accessToken = typeof oauthJson.access_token === "string" ? oauthJson.access_token : "";
  if (!oauth.ok || !accessToken) {
    return NextResponse.json({
      configured: true,
      tokenOk: false,
      sandbox,
      oauthStatus: oauth.status,
      error: oauthJson.error ?? "oauth_failed",
      errorDescription:
        typeof oauthJson.error_description === "string" ? oauthJson.error_description.slice(0, 240) : null,
      listedCount: 0,
      marketplace,
    });
  }

  const params = new URLSearchParams({
    q: "1901 Liberty Head V Nickel",
    limit: "3",
  });
  const browse = await fetch(`${browseUrl}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace,
    },
    cache: "no-store",
  });
  const browseJson = await readJson(browse);
  const summaries = Array.isArray(browseJson.itemSummaries) ? browseJson.itemSummaries : [];
  return NextResponse.json({
    configured: true,
    tokenOk: true,
    sandbox,
    oauthStatus: oauth.status,
    browseStatus: browse.status,
    listedCount: summaries.length,
    hasImage: summaries.some((row) => {
      const image = (row as { image?: { imageUrl?: string } }).image?.imageUrl;
      return Boolean(image);
    }),
    browseError: Array.isArray(browseJson.errors)
      ? (browseJson.errors as Array<{ message?: string }>)
          .map((row) => row.message)
          .filter(Boolean)
          .join("; ")
      : null,
    marketplace,
  });
}
