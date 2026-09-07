import "server-only";

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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

const dataDir = path.join(process.cwd(), "data");
const usersPath = path.join(dataDir, "users.json");
const marketsDir = path.join(dataDir, "markets");

function ensureDirs() {
  mkdirSync(marketsDir, { recursive: true });
}

function readUsers(): UsersFile {
  ensureDirs();
  try {
    return JSON.parse(readFileSync(usersPath, "utf8")) as UsersFile;
  } catch {
    return { users: [] };
  }
}

function writeUsers(file: UsersFile) {
  ensureDirs();
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
  ensureDirs();
  try {
    return { ...emptyMarket, ...JSON.parse(readFileSync(marketPath(userId), "utf8")) };
  } catch {
    return emptyMarket;
  }
}

export function saveUserMarket(userId: string, state: MarketState) {
  ensureDirs();
  writeFileSync(marketPath(userId), JSON.stringify(state));
}

export function loadAllUserListings() {
  ensureDirs();
  const listings: Listing[] = [];
  for (const file of readdirSync(marketsDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const state = JSON.parse(readFileSync(path.join(marketsDir, file), "utf8")) as MarketState;
      listings.push(...(state.listings ?? []));
    } catch {
      /* skip a bad file */
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
