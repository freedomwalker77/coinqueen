import "server-only";

import type { UserRecord } from "./db";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const AUTH_PREFIX = "mve1.";
const NOTE_PREFIX = "MVE_AUTH:";
const THREAD_PREFIX = "MVE_THREADS:";
const THREAD_EMAIL = "mve-threads@myvaultexchange.com";

type GhlContact = {
  id?: string;
  email?: string;
  website?: string;
  contact?: { id?: string; website?: string; email?: string };
};

function ghlAuth() {
  const key = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!key || !locationId) return null;
  return { key, locationId };
}

function ghlHeaders(key: string) {
  return {
    Authorization: `Bearer ${key}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function ghlFetch(url: string, key: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: { ...ghlHeaders(key), ...init?.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? name;
  const lastName = parts.slice(1).join(" ") || undefined;
  return { firstName, lastName, name: name.trim() };
}

function compactUser(user: UserRecord): UserRecord {
  const { ebayAccessToken: _access, ...rest } = user;
  return {
    ...rest,
    email: user.email.toLowerCase(),
  };
}

function decodePayload(raw: string): UserRecord | null {
  try {
    const json = Buffer.from(raw.slice(AUTH_PREFIX.length), "base64url").toString("utf8");
    const user = JSON.parse(json) as UserRecord;
    if (!user?.id || !user.email || !user.passwordHash) return null;
    return user;
  } catch {
    return null;
  }
}

function decodeAuth(website?: string): UserRecord | null {
  if (!website) return null;
  if (website.startsWith(AUTH_PREFIX)) return decodePayload(website);
  try {
    const url = new URL(website);
    const raw = url.searchParams.get("mve") || "";
    if (raw.startsWith(AUTH_PREFIX)) return decodePayload(raw);
  } catch {
    /* not a URL */
  }
  return null;
}

function decodeNote(body?: string): UserRecord | null {
  if (!body?.startsWith(NOTE_PREFIX)) return null;
  try {
    const user = JSON.parse(body.slice(NOTE_PREFIX.length)) as UserRecord;
    if (!user?.id || !user.email || !user.passwordHash) return null;
    return user;
  } catch {
    return null;
  }
}

function contactId(row: GhlContact | null | undefined) {
  return row?.id || row?.contact?.id || "";
}

async function upsertContactRecord(input: { name: string; email: string }) {
  const auth = ghlAuth();
  if (!auth) return null;
  const { firstName, lastName, name } = splitName(input.name);
  const response = await ghlFetch(`${GHL_API}/contacts/upsert`, auth.key, {
    method: "POST",
    body: JSON.stringify({
      locationId: auth.locationId,
      email: input.email.toLowerCase(),
      name,
      firstName,
      lastName,
      source: "MyVaultExchange",
      tags: ["myvaultexchange", "site-signup"],
      website: "https://myvaultexchange.com",
    }),
  });
  if (!response.ok) {
    console.error("GHL contact upsert failed", response.status);
    return null;
  }
  return (await response.json()) as GhlContact;
}

async function findContactByEmail(email: string) {
  const auth = ghlAuth();
  if (!auth) return null;
  const lookup = new URL(`${GHL_API}/contacts/lookup`);
  lookup.searchParams.set("locationId", auth.locationId);
  lookup.searchParams.set("email", email.toLowerCase());
  let response = await ghlFetch(lookup.toString(), auth.key);
  if (!response.ok) {
    const search = new URL(`${GHL_API}/contacts/`);
    search.searchParams.set("locationId", auth.locationId);
    search.searchParams.set("query", email.toLowerCase());
    search.searchParams.set("limit", "5");
    response = await ghlFetch(search.toString(), auth.key);
  }
  if (!response.ok) return null;
  const json = (await response.json()) as { contacts?: GhlContact[]; contact?: GhlContact } & GhlContact;
  const rows = json.contacts ?? (json.contact ? [json.contact] : json.id ? [json] : []);
  const match = rows.find((row) => (row.email || row.contact?.email || "").toLowerCase() === email.toLowerCase());
  return match ?? rows[0] ?? null;
}

async function saveAuthNote(contactIdValue: string, user: UserRecord) {
  const auth = ghlAuth();
  if (!auth) return false;
  const body = NOTE_PREFIX + JSON.stringify(compactUser(user));
  const create = await ghlFetch(`${GHL_API}/contacts/${contactIdValue}/notes`, auth.key, {
    method: "POST",
    body: JSON.stringify({ body, title: "MyVaultExchange account" }),
  });
  if (create.ok) return true;
  console.error("GHL note create failed", create.status);
  return false;
}

async function loadAuthFromNotes(contactIdValue: string) {
  const auth = ghlAuth();
  if (!auth) return null;
  const response = await ghlFetch(`${GHL_API}/contacts/${contactIdValue}/notes`, auth.key);
  if (!response.ok) return null;
  const json = (await response.json()) as { notes?: Array<{ body?: string }> };
  const accounts = (json.notes ?? []).map((note) => decodeNote(note.body)).filter((row): row is UserRecord => Boolean(row));
  return accounts.find((row) => row.ebayRefreshToken) ?? accounts.at(-1) ?? null;
}

/** Create or update a GHL contact. Never throws. */
export async function upsertGhlContact(input: { name: string; email: string }) {
  if (!ghlAuth()) return;
  try {
    await upsertContactRecord(input);
  } catch (error) {
    console.error("GHL contact upsert error", error);
  }
}

export async function persistGhlAccount(user: UserRecord) {
  if (!ghlAuth()) return false;
  try {
    const row = await upsertContactRecord({ name: user.name, email: user.email });
    const id = contactId(row) || contactId(await findContactByEmail(user.email));
    if (!id) {
      console.error("GHL persist account missing contact id");
      return false;
    }
    return saveAuthNote(id, user);
  } catch (error) {
    console.error("GHL persist account error", error);
    return false;
  }
}

export async function loadGhlAccount(email: string): Promise<UserRecord | null> {
  if (!ghlAuth()) return null;
  try {
    const row = await findContactByEmail(email);
    if (!row) return null;
    const fromSite = decodeAuth(row.website || row.contact?.website);
    const id = contactId(row);
    const fromNote = id ? await loadAuthFromNotes(id) : null;
    const accounts = [fromNote, fromSite].filter((account): account is UserRecord =>
      Boolean(account && account.email === email.toLowerCase()),
    );
    return accounts.find((row) => row.ebayRefreshToken) ?? accounts[0] ?? null;
  } catch (error) {
    console.error("GHL load account error", error);
    return null;
  }
}

export async function persistGhlThreads(store: { conversations: unknown[] }) {
  if (!ghlAuth()) return false;
  try {
    const row = await upsertContactRecord({ name: "MyVaultExchange Messages", email: THREAD_EMAIL });
    const id = contactId(row) || contactId(await findContactByEmail(THREAD_EMAIL));
    if (!id) return false;
    const auth = ghlAuth();
    if (!auth) return false;
    const body = THREAD_PREFIX + JSON.stringify(store);
    const create = await ghlFetch(`${GHL_API}/contacts/${id}/notes`, auth.key, {
      method: "POST",
      body: JSON.stringify({ body, title: "MyVaultExchange messages" }),
    });
    return create.ok;
  } catch (error) {
    console.error("GHL persist threads error", error);
    return false;
  }
}

export async function loadGhlThreads(): Promise<{ conversations: Array<Record<string, unknown>> } | null> {
  if (!ghlAuth()) return null;
  try {
    const row = await findContactByEmail(THREAD_EMAIL);
    const id = contactId(row);
    if (!id) return null;
    const auth = ghlAuth();
    if (!auth) return null;
    const response = await ghlFetch(`${GHL_API}/contacts/${id}/notes`, auth.key);
    if (!response.ok) return null;
    const json = (await response.json()) as { notes?: Array<{ body?: string }> };
    const notes = (json.notes ?? [])
      .map((note) => note.body)
      .filter((body): body is string => Boolean(body?.startsWith(THREAD_PREFIX)));
    const raw = notes.at(-1);
    if (!raw) return null;
    const parsed = JSON.parse(raw.slice(THREAD_PREFIX.length)) as { conversations?: Array<Record<string, unknown>> };
    return { conversations: parsed.conversations ?? [] };
  } catch (error) {
    console.error("GHL load threads error", error);
    return null;
  }
}

export async function searchGhlUserByShop(slug: string) {
  if (!ghlAuth()) return null;
  const auth = ghlAuth();
  if (!auth) return null;
  try {
    const search = new URL(`${GHL_API}/contacts/`);
    search.searchParams.set("locationId", auth.locationId);
    search.searchParams.set("query", slug);
    search.searchParams.set("limit", "10");
    const response = await ghlFetch(search.toString(), auth.key);
    if (!response.ok) return null;
    const json = (await response.json()) as { contacts?: GhlContact[] };
    for (const row of json.contacts ?? []) {
      const id = contactId(row);
      if (!id) continue;
      const user = await loadAuthFromNotes(id);
      if (user?.shopSlug === slug) {
        return { id: user.id, name: user.name, shopSlug: user.shopSlug };
      }
    }
  } catch (error) {
    console.error("GHL shop lookup error", error);
  }
  return null;
}

export async function pingGhl() {
  const auth = ghlAuth();
  if (!auth) {
    return { configured: false, ok: false, contactCount: 0 };
  }
  try {
    const response = await ghlFetch(
      `${GHL_API}/contacts/?locationId=${encodeURIComponent(auth.locationId)}&limit=1`,
      auth.key,
    );
    const json = (await response.json()) as { meta?: { total?: number } };
    return {
      configured: true,
      ok: response.ok,
      status: response.status,
      contactCount: typeof json.meta?.total === "number" ? json.meta.total : null,
    };
  } catch {
    return { configured: true, ok: false, contactCount: 0 };
  }
}
