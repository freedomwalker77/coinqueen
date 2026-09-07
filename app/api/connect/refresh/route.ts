import { NextResponse } from "next/server";
import { createConnectOnboardingUrl } from "@/lib/connect";
import { findUserById } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { appOrigin } from "@/lib/stripe";

export async function GET() {
  const origin = await appOrigin();
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.redirect(`${origin}/login`);
  }
  const user = findUserById(session.id);
  if (!user) {
    return NextResponse.redirect(`${origin}/sell`);
  }

  try {
    const result = await createConnectOnboardingUrl(user);
    if ("error" in result) {
      return NextResponse.redirect(`${origin}/sell?connect=error`);
    }
    return NextResponse.redirect(result.url);
  } catch {
    return NextResponse.redirect(`${origin}/sell?connect=error`);
  }
}
