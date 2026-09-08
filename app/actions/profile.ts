"use server";

import bcrypt from "bcryptjs";
import { resolvePersistedUser } from "@/lib/account";
import { getConnectStatus } from "@/app/actions/connect";
import { getEbayStatus } from "@/app/actions/ebay";
import { loadUserMarket, updateUser, deleteUser } from "@/lib/db";
import { persistGhlAccount } from "@/lib/ghl";
import { applyReferralToUser } from "@/app/actions/ambassador";
import { createSession, deleteSession, getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

function publicProfile(user: {
  id: string;
  name: string;
  email: string;
  shopSlug: string;
  createdAt: string;
  bio?: string;
  avatarUrl?: string;
  shipName?: string;
  shipLine1?: string;
  shipCity?: string;
  shipRegion?: string;
  shipPostal?: string;
  shipCountry?: string;
  inviteCode?: string;
  referralCode?: string;
  country?: string;
}) {
  return {
    name: user.name,
    email: user.email,
    shopSlug: user.shopSlug,
    createdAt: user.createdAt,
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
    shipName: user.shipName ?? user.name,
    shipLine1: user.shipLine1 ?? "",
    shipCity: user.shipCity ?? "",
    shipRegion: user.shipRegion ?? "",
    shipPostal: user.shipPostal ?? "",
    shipCountry: user.shipCountry ?? user.country ?? "",
    inviteCode: user.inviteCode ?? "",
    referralCode: user.referralCode ?? "",
  };
}

export async function getProfile() {
  const session = await getSessionUser();
  if (!session) return { user: null };
  const user = await resolvePersistedUser(session);
  if (!user) return { user: null };
  const market = loadUserMarket(user.id);
  const spent = market.orders.reduce((sum, order) => sum + order.total, 0);
  const [connect, ebay] = await Promise.all([getConnectStatus(), getEbayStatus()]);
  return {
    user: publicProfile(user),
    connect,
    ebayConnected: ebay.connected,
    ebayMarketplace: ebay.marketplace,
    spent,
    orders: market.orders.length,
  };
}

export async function savePublicProfile(input: { name: string; bio: string; avatarUrl: string }) {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." };
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found." };
  const name = input.name.trim();
  if (name.length < 2) return { error: "Display name must be at least 2 characters." };
  const avatarUrl = input.avatarUrl.trim();
  if (
    avatarUrl &&
    !/^https:\/\//i.test(avatarUrl) &&
    !/^data:image\/(jpeg|png|webp);base64,/i.test(avatarUrl)
  ) {
    return { error: "Use a photo file or an https image URL." };
  }
  if (avatarUrl.length > 140000) return { error: "Photo is too large. Try a smaller picture." };
  const saved = updateUser(user.id, {
    name,
    bio: input.bio.trim().slice(0, 500),
    avatarUrl,
  });
  if (!saved) return { error: "Could not save profile." };
  await persistGhlAccount(saved);
  await createSession(saved);
  return { ok: true as const };
}

export async function saveShippingAddress(input: {
  shipName: string;
  shipLine1: string;
  shipCity: string;
  shipRegion: string;
  shipPostal: string;
  shipCountry: string;
}) {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." };
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found." };
  const saved = updateUser(user.id, {
    shipName: input.shipName.trim(),
    shipLine1: input.shipLine1.trim(),
    shipCity: input.shipCity.trim(),
    shipRegion: input.shipRegion.trim(),
    shipPostal: input.shipPostal.trim(),
    shipCountry: input.shipCountry.trim().toUpperCase(),
  });
  if (!saved) return { error: "Could not save address." };
  await persistGhlAccount(saved);
  return { ok: true as const };
}

export async function saveInviteCode(code: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." };
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found." };
  const saved = updateUser(user.id, { inviteCode: code.trim().slice(0, 40) });
  if (!saved) return { error: "Could not save code." };
  await persistGhlAccount(saved);
  await applyReferralToUser(user.id, saved.inviteCode);
  return { ok: true as const };
}

export async function changePassword(input: { current: string; next: string }) {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." };
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found." };
  const ok = await bcrypt.compare(input.current, user.passwordHash);
  if (!ok) return { error: "Current password is incorrect." };
  if (input.next.length < 8 || !/[a-zA-Z]/.test(input.next) || !/[0-9]/.test(input.next)) {
    return { error: "New password needs 8+ characters with a letter and a number." };
  }
  const passwordHash = await bcrypt.hash(input.next, 10);
  const saved = updateUser(user.id, { passwordHash });
  if (!saved) return { error: "Could not update password." };
  await persistGhlAccount(saved);
  return { ok: true as const };
}

export async function disconnectEbay() {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in first." };
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found." };
  const saved = updateUser(user.id, {
    ebayRefreshToken: "",
    ebayAccessToken: "",
    ebayTokenExpires: 0,
  });
  if (saved) await persistGhlAccount(saved);
  return { ok: true as const };
}

export async function deleteMyAccount() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  deleteUser(session.id);
  await deleteSession();
  redirect("/");
}
