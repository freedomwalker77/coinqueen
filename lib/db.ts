import "server-only";

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Listing } from "./market";
import { emptyMarket, type MarketState } from "./marketState";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  shopSlug: string;
  createdAt: string;
  stripeAccountId?: string;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  country?: string;
};

type UsersFile = { users: UserRecord[] };

const bundledDir = path.join(process.cwd(), "data");
const writableDir = process.env.VERCEL ? "/tmp/myvaultexchange-data" : bundledDir;
const usersPath = path.join(writableDir, "users.json");
const bundledUsersPath = path.join(bundledDir, "users.json");
const marketsDir = path.join(writableDir, "markets");
const bundledMarketsDir = path.join(bundledDir, "markets");

function ensureWritable() {
  mkdirSync(marketsDir, { recursive: true });
}

function readUsers(): UsersFile {
  for (const file of [usersPath, bundledUsersPath]) {
    try {
      if (!existsSync(file)) continue;
      return JSON.parse(readFileSync(file, "utf8")) as UsersFile;
    } catch {
      /* try the next path */
    }
  }
  return { users: [] };
}

function writeUsers(file: UsersFile) {
  ensureWritable();
  writeFileSync(usersPath, JSON.stringify(file, null, 2));
}

export function createUser(input: { name: string; email: string; passwordHash: string }) {
  const file = readUsers();
  if (file.users.some((user) => user.email === input.email)) {
    return { error: "An account with that email already exists." as const };
  }
  const id = crypto.randomUUID();
  const user: UserRecord = {
    ...input,
    id,
    shopSlug: slugifyShop(input.name, id),
    createdAt: new Date().toISOString(),
  };
  file.users.push(user);
  writeUsers(file);
  return { user };
}

export function findUserByEmail(email: string) {
  return readUsers().users.find((user) => user.email === email.toLowerCase());
}

export function findUserById(id: string) {
  return readUsers().users.find((user) => user.id === id);
}

export function findUserByShopSlug(slug: string) {
  return readUsers().users.find((user) => user.shopSlug === slug);
}

export function updateUser(
  id: string,
  patch: Partial<
    Pick<UserRecord, "stripeAccountId" | "stripeChargesEnabled" | "stripePayoutsEnabled" | "country">
  >,
) {
  const file = readUsers();
  const user = file.users.find((row) => row.id === id);
  if (!user) return null;
  Object.assign(user, patch);
  writeUsers(file);
  return user;
}

function marketPath(userId: string) {
  return path.join(marketsDir, `${userId}.json`);
}

export function loadUserMarket(userId: string): MarketState {
  for (const dir of [marketsDir, bundledMarketsDir]) {
    try {
      const file = path.join(dir, `${userId}.json`);
      if (!existsSync(file)) continue;
      return { ...emptyMarket, ...JSON.parse(readFileSync(file, "utf8")) };
    } catch {
      /* try the next path */
    }
  }
  return emptyMarket;
}

export function saveUserMarket(userId: string, state: MarketState) {
  ensureWritable();
  writeFileSync(marketPath(userId), JSON.stringify(state));
}

export function loadAllUserListings() {
  const listings: Listing[] = [];
  const seen = new Set<string>();
  for (const dir of [marketsDir, bundledMarketsDir]) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const state = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as MarketState;
        for (const listing of state.listings ?? []) {
          if (seen.has(listing.id)) continue;
          seen.add(listing.id);
          listings.push(listing);
        }
      } catch {
        /* skip a bad file */
      }
    }
  }
  return listings;
}

export function slugifyShop(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "collector";
  return `${base}-${userId.slice(0, 6)}`;
}
