import { NextResponse } from "next/server";
import { findUserById, updateUser } from "@/lib/db";
import { persistGhlAccount } from "@/lib/ghl";
import { exchangeEbayAuthCode } from "@/lib/ebaySell";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (!code && !error) {
    return NextResponse.json({
      ok: true,
      app: "MyVaultExchange",
      message:
        "eBay OAuth return URL. Application tokens search public listings. User tokens (after Sign in with eBay) can publish your shop listings.",
    });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  if (error) {
    return NextResponse.redirect(`${origin}/sell?ebay=denied`);
  }

  const session = await getSessionUser();
  if (!session) return NextResponse.redirect(`${origin}/login`);
  const user = findUserById(session.id);
  if (!user) return NextResponse.redirect(`${origin}/sell?ebay=error`);

  const token = await exchangeEbayAuthCode(code!);
  if ("error" in token) {
    return NextResponse.redirect(`${origin}/sell?ebay=error`);
  }

  const saved = updateUser(user.id, {
    ebayAccessToken: token.accessToken,
    ebayRefreshToken: token.refreshToken ?? user.ebayRefreshToken,
    ebayTokenExpires: token.expires,
  });
  if (saved) void persistGhlAccount(saved);
  return NextResponse.redirect(`${origin}/sell?ebay=connected`);
}
