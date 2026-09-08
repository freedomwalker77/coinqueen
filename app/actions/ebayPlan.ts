"use server";

import { redirect } from "next/navigation";
import { resolvePersistedUser } from "@/lib/account";
import {
  applyEbayPlanCheckoutSession,
  createEbayPlanCheckoutUrl,
  createEbayPlanPortalUrl,
  refreshEbayPlan,
} from "@/lib/ebayPlan";
import { getSessionUser } from "@/lib/session";

export async function startEbayPlanCheckout() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/sell");
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found." as const };
  const live = await refreshEbayPlan(user);
  if (live.subscribed) redirect("/sell");
  let url: string;
  try {
    const result = await createEbayPlanCheckoutUrl(user);
    if ("error" in result) return result;
    url = result.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return { error: message };
  }
  redirect(url);
}

export async function openEbayPlanPortal() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/sell");
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found." as const };
  let url: string;
  try {
    const result = await createEbayPlanPortalUrl(user);
    if ("error" in result) return result;
    url = result.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not open billing.";
    return { error: message };
  }
  redirect(url);
}

export async function applyEbayPlanReturn(sessionId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." as const };
  try {
    return await applyEbayPlanCheckoutSession(sessionId, session.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not confirm the subscription.";
    return { error: message };
  }
}
