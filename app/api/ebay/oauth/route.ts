import { NextResponse } from "next/server";
import { resolvePersistedUser } from "@/lib/account";
import { updateUser } from "@/lib/db";
import { persistGhlAccount } from "@/lib/ghl";
import { exchangeEbayAuthCode } from "@/lib/ebaySell";
import { getSessionUser } from "@/lib/session";

function sellRedirect(origin: string, ebay: string, reason?: string) {
  const url = new URL("/sell", origin);
  url.searchParams.set("ebay", ebay);
  if (reason) url.searchParams.set("reason", reason.slice(0, 180));
  return NextResponse.redirect(url);
}

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
    return sellRedirect(origin, "denied", url.searchParams.get("error_description") || error);
  }

  const session = await getSessionUser();
  if (!session) return NextResponse.redirect(new URL("/login", origin));
  const user = await resolvePersistedUser(session);
  if (!user) {
    return sellRedirect(
      origin,
      "error",
      session.email
        ? "Could not load your MyVaultExchange account after eBay returned."
        : "Log out, log in once, then click Sign in with eBay again.",
    );
  }

  const token = await exchangeEbayAuthCode(code!);
  if ("error" in token) {
    return sellRedirect(origin, "error", token.error);
  }
  if (!token.refreshToken) {
    return sellRedirect(
      origin,
      "error",
      "eBay signed you in but did not return a refresh token. On the RuName, enable OAuth (not only Auth'n'Auth) and sell.inventory / sell.account.",
    );
  }

  const saved = updateUser(user.id, {
    ebayAccessToken: token.accessToken,
    ebayRefreshToken: token.refreshToken,
    ebayTokenExpires: token.expires,
  });
  if (!saved) return sellRedirect(origin, "error", "Could not save the eBay connection to your account.");
  await persistGhlAccount(saved);
  return sellRedirect(origin, "connected");
}
