"use server";

import { redirect } from "next/navigation";
import {
  createConnectDashboardUrl,
  createConnectOnboardingUrl,
  refreshConnectAccount,
} from "@/lib/connect";
import type { ConnectStatus } from "@/lib/definitions";
import { isConnectCountry } from "@/lib/countries";
import { findUserById, updateUser } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { stripeEnabled } from "@/lib/stripe";

export async function getConnectStatus(): Promise<ConnectStatus> {
  const session = await getSessionUser();
  if (!session) {
    return { enabled: stripeEnabled(), accountId: null, chargesEnabled: false, payoutsEnabled: false, country: null };
  }
  const user = findUserById(session.id);
  if (!user) {
    return { enabled: stripeEnabled(), accountId: null, chargesEnabled: false, payoutsEnabled: false, country: null };
  }
  try {
    return await refreshConnectAccount(user);
  } catch {
    return {
      enabled: stripeEnabled(),
      accountId: user.stripeAccountId ?? null,
      chargesEnabled: Boolean(user.stripeChargesEnabled),
      payoutsEnabled: Boolean(user.stripePayoutsEnabled),
      country: user.country ?? null,
    };
  }
}

export async function startConnectOnboarding(formData?: FormData): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  let user = findUserById(session.id);
  if (!user) return { error: "Account not found." };

  const picked = String(formData?.get("country") ?? "").trim().toUpperCase();
  if (!user.stripeAccountId) {
    const country = picked || user.country || "";
    if (!isConnectCountry(country)) {
      return { error: "Choose the country where you receive payouts." };
    }
    user = updateUser(user.id, { country }) ?? user;
  }

  let url: string;
  try {
    const result = await createConnectOnboardingUrl(user);
    if ("error" in result) return { error: result.error };
    url = result.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start Stripe Connect.";
    return { error: message };
  }

  redirect(url);
}

export async function openConnectDashboard(): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const user = findUserById(session.id);
  if (!user?.stripeAccountId) return { error: "Connect Stripe first." };

  let url: string;
  try {
    const dashboard = await createConnectDashboardUrl(user.stripeAccountId);
    if (!dashboard) return { error: "Could not open the Stripe Express dashboard." };
    url = dashboard;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not open the Stripe Express dashboard.";
    return { error: message };
  }

  redirect(url);
}
