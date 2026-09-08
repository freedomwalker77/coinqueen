import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { findUserById, findUserByShopSlug, listPublicUsers } from "./db";
import { loadGhlThreads, persistGhlThreads, searchGhlUserByShop } from "./ghl";

export type ChatMessage = {
  id: string;
  fromId: string;
  body: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  participantIds: [string, string];
  names: Record<string, string>;
  slugs: Record<string, string>;
  listingId?: string;
  listingTitle?: string;
  messages: ChatMessage[];
  updatedAt: string;
};

export type ThreadStore = { conversations: Conversation[] };

const bundledDir = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const writableDir = process.env.VERCEL ? "/tmp/myvaultexchange-data" : bundledDir;
const threadsPath = path.join(/* turbopackIgnore: true */ writableDir, "threads.json");
const bundledThreadsPath = path.join(/* turbopackIgnore: true */ bundledDir, "threads.json");

function emptyStore(): ThreadStore {
  return { conversations: [] };
}

function readFileStore(): ThreadStore {
  for (const file of [threadsPath, bundledThreadsPath]) {
    try {
      if (!existsSync(/* turbopackIgnore: true */ file)) continue;
      const json = JSON.parse(readFileSync(/* turbopackIgnore: true */ file, "utf8")) as ThreadStore;
      return { conversations: json.conversations ?? [] };
    } catch {
      /* try next */
    }
  }
  return emptyStore();
}

function writeFileStore(store: ThreadStore) {
  mkdirSync(/* turbopackIgnore: true */ writableDir, { recursive: true });
  writeFileSync(/* turbopackIgnore: true */ threadsPath, JSON.stringify(store));
}

export function conversationId(a: string, b: string) {
  return [a, b].sort().join(":");
}

function mergeStores(local: ThreadStore, remote: ThreadStore | null): ThreadStore {
  const byId = new Map<string, Conversation>();
  for (const row of [...(remote?.conversations ?? []), ...local.conversations]) {
    const current = byId.get(row.id);
    if (!current || row.updatedAt > current.updatedAt) byId.set(row.id, row);
  }
  return { conversations: [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
}

export async function loadThreadStore(): Promise<ThreadStore> {
  const remote = (await loadGhlThreads()) as ThreadStore | null;
  return mergeStores(readFileStore(), remote);
}

async function saveThreadStore(store: ThreadStore) {
  writeFileStore(store);
  await persistGhlThreads(store);
}

export async function conversationsFor(userId: string) {
  const store = await loadThreadStore();
  return store.conversations.filter((row) => row.participantIds.includes(userId));
}

export async function conversationFor(userId: string, id: string) {
  const row = (await conversationsFor(userId)).find((item) => item.id === id);
  return row ?? null;
}

export async function resolveShopUser(slug: string) {
  const local = findUserByShopSlug(slug);
  if (local) return { id: local.id, name: local.name, shopSlug: local.shopSlug };
  const listed = listPublicUsers().find((user) => user.shopSlug === slug);
  if (listed) return listed;
  return searchGhlUserByShop(slug);
}

export async function sendChat(input: {
  from: { id: string; name: string; shopSlug: string };
  toSlug: string;
  body: string;
  listingId?: string;
  listingTitle?: string;
}) {
  const text = input.body.trim().slice(0, 2000);
  if (!text) return { error: "Write a message first." as const };
  const to = await resolveShopUser(input.toSlug);
  if (!to) return { error: "That shop does not have a MyVaultExchange account yet." as const };
  if (to.id === input.from.id) return { error: "You cannot message your own shop." as const };

  const id = conversationId(input.from.id, to.id);
  const store = await loadThreadStore();
  const existing = store.conversations.find((row) => row.id === id);
  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    fromId: input.from.id,
    body: text,
    createdAt: new Date().toISOString(),
  };
  const names = {
    ...(existing?.names ?? {}),
    [input.from.id]: input.from.name,
    [to.id]: to.name,
  };
  const slugs = {
    ...(existing?.slugs ?? {}),
    [input.from.id]: input.from.shopSlug,
    [to.id]: to.shopSlug,
  };
  const next: Conversation = {
    id,
    participantIds: [input.from.id, to.id].sort() as [string, string],
    names,
    slugs,
    listingId: input.listingId || existing?.listingId,
    listingTitle: input.listingTitle || existing?.listingTitle,
    messages: [...(existing?.messages ?? []), message].slice(-100),
    updatedAt: message.createdAt,
  };
  const conversations = [next, ...store.conversations.filter((row) => row.id !== id)].slice(0, 80);
  await saveThreadStore({ conversations });
  return { conversation: next };
}

export function otherParty(row: Conversation, userId: string) {
  const otherId = row.participantIds.find((id) => id !== userId) ?? row.participantIds[0];
  return {
    id: otherId,
    name: row.names[otherId] || "Collector",
    shopSlug: row.slugs[otherId] || "",
  };
}

export function preview(row: Conversation) {
  const last = row.messages.at(-1);
  return last?.body.slice(0, 80) ?? "";
}

export function findUserPublic(id: string) {
  const user = findUserById(id);
  if (!user) return null;
  return { id: user.id, name: user.name, shopSlug: user.shopSlug };
}
