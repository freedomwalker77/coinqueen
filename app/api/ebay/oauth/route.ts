import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "MyVaultExchange",
    message:
      "eBay OAuth return URL. MyVaultExchange uses an application token to search public listings, not a signed-in eBay user.",
  });
}
