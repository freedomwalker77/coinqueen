import "server-only";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? name;
  const lastName = parts.slice(1).join(" ") || undefined;
  return { firstName, lastName, name: name.trim() };
}

/** Create or update a GHL contact. Never throws — signup must still succeed. */
export async function upsertGhlContact(input: { name: string; email: string }) {
  const key = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!key || !locationId) return;

  const { firstName, lastName, name } = splitName(input.name);
  try {
    const response = await fetch(`${GHL_API}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        Version: GHL_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        locationId,
        email: input.email.toLowerCase(),
        name,
        firstName,
        lastName,
        source: "MyVaultExchange",
        tags: ["myvaultexchange", "site-signup"],
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("GHL contact upsert failed", response.status);
    }
  } catch (error) {
    console.error("GHL contact upsert error", error);
  }
}

export async function pingGhl() {
  const key = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!key || !locationId) {
    return { configured: false, ok: false, contactCount: 0 };
  }
  try {
    const response = await fetch(
      `${GHL_API}/contacts/?locationId=${encodeURIComponent(locationId)}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          Version: GHL_VERSION,
          Accept: "application/json",
        },
        cache: "no-store",
      },
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
