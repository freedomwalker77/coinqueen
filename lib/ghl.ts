import "server-only";

import type { UserRecord } from "./db";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const AUTH_PREFIX = "mve1.";

type GhlContact = {
  id?: string;
  email?: string;
  website?: string;
  contact?: { id?: string; website?: string };
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

function encodeAuth(user: UserRecord) {
  const payload = AUTH_PREFIX + Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  return `https://myvaultexchange.com/?mve=${payload}`;
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

function contactId(row: GhlContact | null | undefined) {
  return row?.id || row?.contact?.id || "";
}

async function upsertContactRecord(input: { name: string; email: string; website?: string }) {
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
      website: input.website,
    }),
  });
  if (!response.ok) {
    console.error("GHL contact upsert failed", response.status);
    return null;
  }
  return (await response.json()) as GhlContact;
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
    const row = await upsertContactRecord({
      name: user.name,
      email: user.email,
      website: encodeAuth(user),
    });
    const id = contactId(row);
    if (!id) return Boolean(row);
    const auth = ghlAuth();
    if (!auth) return false;
    const update = await ghlFetch(`${GHL_API}/contacts/${id}`, auth.key, {
      method: "PUT",
      body: JSON.stringify({ website: encodeAuth(user) }),
    });
    if (!update.ok) console.error("GHL contact update failed", update.status);
    return true;
  } catch (error) {
    console.error("GHL persist account error", error);
    return false;
  }
}

export async function loadGhlAccount(email: string): Promise<UserRecord | null> {
  const auth = ghlAuth();
  if (!auth) return null;
  try {
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
    for (const row of rows) {
      const website = row.website || row.contact?.website;
      const user = decodeAuth(website);
      if (user && user.email === email.toLowerCase()) return user;
    }
    return null;
  } catch (error) {
    console.error("GHL load account error", error);
    return null;
  }
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
