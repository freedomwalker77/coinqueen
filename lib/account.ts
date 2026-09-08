import "server-only";

import type { SessionUser } from "./definitions";
import { findUserById, findUserByShopSlug, upsertUser, type UserRecord } from "./db";
import { loadGhlAccount } from "./ghl";

export async function resolvePersistedUser(session: SessionUser): Promise<UserRecord | null> {
  const local = findUserById(session.id) ?? (session.shopSlug ? findUserByShopSlug(session.shopSlug) : undefined);
  if (local) return local;
  if (!session.email) return null;
  const remote = await loadGhlAccount(session.email);
  if (!remote) return null;
  return upsertUser({
    ...remote,
    id: session.id,
    name: session.name || remote.name,
    shopSlug: session.shopSlug || remote.shopSlug,
  });
}
