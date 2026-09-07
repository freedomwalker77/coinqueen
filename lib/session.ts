import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload, SessionUser } from "./definitions";
import { findUserById } from "./db";

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
  return "myvaultexchange-dev-session-secret";
}

const encodedKey = new TextEncoder().encode(secretKey());

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

function sessionCookieDomain() {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").hostname;
    if (host === "myvaultexchange.com" || host.endsWith(".myvaultexchange.com")) {
      return ".myvaultexchange.com";
    }
  } catch {
    /* local */
  }
  return undefined;
}

export async function createSession(user: { id: string; name: string; shopSlug: string }) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const session = await encrypt({
    userId: user.id,
    name: user.name,
    shopSlug: user.shopSlug,
    expiresAt,
  });
  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    sameSite: "lax",
    path: "/",
    domain: sessionCookieDomain(),
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const domain = sessionCookieDomain();
  if (domain) {
    cookieStore.delete({ name: "session", path: "/", domain });
  } else {
    cookieStore.delete("session");
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const payload = await decrypt(token);
  if (!payload?.userId) return null;
  const user = findUserById(payload.userId);
  if (user) return { id: user.id, name: user.name, shopSlug: user.shopSlug };
  if (payload.name && payload.shopSlug) {
    return { id: payload.userId, name: payload.name, shopSlug: payload.shopSlug };
  }
  return null;
}
