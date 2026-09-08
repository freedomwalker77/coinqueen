import { NextResponse } from "next/server";
import { ebayAuthorizeUrl, ebaySellConfigured } from "@/lib/ebaySell";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const session = await getSessionUser();
  if (!session) return NextResponse.redirect(`${origin}/login`);
  if (!ebaySellConfigured()) return NextResponse.redirect(`${origin}/sell?ebay=need_runame`);
  return NextResponse.redirect(ebayAuthorizeUrl(session.id));
}
