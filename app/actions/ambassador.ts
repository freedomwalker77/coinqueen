"use server";

import { cookies } from "next/headers";
import { findUserById, findUserByReferralCode, listDirectoryUsers, loadUserMarket, updateUser } from "@/lib/db";
import { persistGhlAccount } from "@/lib/ghl";
import { resolvePersistedUser } from "@/lib/account";
import { getSessionUser } from "@/lib/session";
import { isSampleListing } from "@/lib/market";

const RANKS = [
  { id: "scout", name: "Scout", min: 0 },
  { id: "connector", name: "Connector", min: 1 },
  { id: "recruiter", name: "Recruiter", min: 3 },
  { id: "advocate", name: "Advocate", min: 8 },
  { id: "partner", name: "Partner", min: 15 },
  { id: "ambassador", name: "Ambassador", min: 30 },
] as const;

function appOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://myvaultexchange.com").replace(/\/$/, "");
}

function rankFor(joined: number) {
  return [...RANKS].reverse().find((row) => joined >= row.min) ?? RANKS[0];
}

function ensureCode(userId: string, existing?: string) {
  return existing || userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function recordReferralVisit(code: string) {
  const owner = findUserByReferralCode(code);
  if (!owner) return;
  const clicks = (owner.referralClicks ?? 0) + 1;
  const saved = updateUser(owner.id, { referralClicks: clicks });
  if (saved) void persistGhlAccount(saved);
}

export async function applyReferralToUser(userId: string, code?: string | null) {
  const user = findUserById(userId);
  if (!user) return;
  const needle = (code || user.inviteCode || "").trim().toUpperCase();
  if (!needle || user.referredBy) return;
  const owner = findUserByReferralCode(needle);
  if (!owner || owner.id === user.id) return;
  const saved = updateUser(user.id, { referredBy: needle, inviteCode: needle });
  if (saved) void persistGhlAccount(saved);
}

export async function getAmbassador() {
  const session = await getSessionUser();
  if (!session) return { user: null };
  const user = await resolvePersistedUser(session);
  if (!user) return { user: null };
  const code = ensureCode(user.id, user.referralCode);
  if (user.referralCode !== code) {
    const saved = updateUser(user.id, { referralCode: code });
    if (saved) void persistGhlAccount(saved);
  }
  const cookieStore = await cookies();
  await applyReferralToUser(user.id, cookieStore.get("mve_ref")?.value);

  const directory = listDirectoryUsers();
  const people = directory.filter((row) => (row.referredBy || "").toUpperCase() === code);
  const peopleLive = people.map((row) => {
    const market = loadUserMarket(row.id);
    const listings = market.listings.filter((item) => !isSampleListing(item)).length;
    const scans = market.collection.length;
    const sales = market.orders.length;
    const volume = market.orders.reduce((sum, order) => sum + order.total, 0);
    return {
      id: row.id,
      name: row.name,
      shopSlug: row.shopSlug,
      createdAt: row.createdAt,
      listings,
      scans,
      sales,
      sold: sales,
      earned: volume * 0.01,
    };
  });
  const joined = peopleLive.length;
  const listed = peopleLive.reduce((sum, row) => sum + row.listings, 0);
  const sellers = peopleLive.filter((row) => row.listings > 0).length;
  const earned = peopleLive.reduce((sum, row) => sum + row.earned, 0);
  const rank = rankFor(joined);
  const next = RANKS.find((row) => row.min > joined);
  const leaderboard = directory
    .map((row) => ({
      id: row.id,
      name: row.name,
      joined: directory.filter((item) => (item.referredBy || "").toUpperCase() === (row.referralCode || "").toUpperCase())
        .length,
    }))
    .sort((a, b) => b.joined - a.joined);
  const place = Math.max(1, leaderboard.findIndex((row) => row.id === user.id) + 1);
  const activity = peopleLive
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((row) => ({
      id: row.id,
      name: row.name,
      shopSlug: row.shopSlug,
      createdAt: row.createdAt,
    }));

  const link = `${appOrigin()}/r/${code}`;
  return {
    user: { name: user.name, shopSlug: user.shopSlug, code, link },
    stats: {
      clicks: user.referralClicks ?? 0,
      joined,
      sellers,
      listed,
      earned,
    },
    rank: {
      name: rank.name,
      min: rank.min,
      nextName: next?.name ?? null,
      nextMin: next?.min ?? null,
      place,
      total: Math.max(leaderboard.length, 1),
    },
    ranks: RANKS.map((row) => ({ ...row, current: row.id === rank.id })),
    activity,
    people: peopleLive,
    leaders: leaderboard.slice(0, 5),
  };
}
