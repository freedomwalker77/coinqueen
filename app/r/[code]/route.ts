import { recordReferralVisit } from "@/app/actions/ambassador";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const store = await cookies();
  if (clean) {
    store.set("mve_ref", clean, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    await recordReferralVisit(clean);
  }
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://myvaultexchange.com";
  return NextResponse.redirect(new URL("/signup", origin));
}
