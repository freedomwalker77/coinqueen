import "server-only";

const OWNER_EMAIL = "freedomwalker77@gmail.com";

export function adminEmails() {
  const extra = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set([OWNER_EMAIL, ...extra]);
}

export function isAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails().has(email.trim().toLowerCase()));
}

export function isAdminUser(user?: { email?: string } | null) {
  return isAdminEmail(user?.email);
}
