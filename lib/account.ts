import "server-only";

import type { SessionUser } from "./definitions";
import { findUserById, findUserByShopSlug, upsertUser, type UserRecord } from "./db";
import { loadGhlAccount } from "./ghl";

export async function resolvePersistedUser(
  session: SessionUser,
  options?: { skipRemoteIfEbay?: boolean },
): Promise<UserRecord | null> {
  const local =
    findUserById(session.id) ?? (session.shopSlug ? findUserByShopSlug(session.shopSlug) : undefined) ?? null;
  if (options?.skipRemoteIfEbay && local?.ebayRefreshToken) return local;
  const remote = session.email ? await loadGhlAccount(session.email) : null;
  if (!local && !remote) return null;
  const base = remote ?? local!;
  return upsertUser({
    ...base,
    ...local,
    id: session.id,
    name: session.name || local?.name || base.name,
    email: (session.email || local?.email || base.email).toLowerCase(),
    shopSlug: session.shopSlug || local?.shopSlug || base.shopSlug,
    ebayRefreshToken: local?.ebayRefreshToken || remote?.ebayRefreshToken,
    ebayAccessToken: local?.ebayAccessToken || remote?.ebayAccessToken,
    ebayTokenExpires: local?.ebayTokenExpires ?? remote?.ebayTokenExpires,
    ebayMarketplace: local?.ebayMarketplace || remote?.ebayMarketplace,
  });
}
