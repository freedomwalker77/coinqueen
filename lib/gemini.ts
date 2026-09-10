const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
].filter((name, index, list): name is string => Boolean(name) && list.indexOf(name) === index);

const OPENROUTER_MODELS = [
  process.env.OPENROUTER_MODEL,
  "google/gemini-flash-latest",
  "google/gemini-3.8-flash",
].filter((name, index, list): name is string => Boolean(name) && list.indexOf(name) === index);

export function visionConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY);
}

function geminiErrorMessage(status: number, body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* use status */
  }
  return `Gemini error ${status}`;
}

async function openRouterComplete(input: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  webSearch?: boolean;
}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  const content: Array<Record<string, unknown>> = [{ type: "text", text: input.prompt }];
  if (input.imageBase64) {
    const mime = input.mimeType || "image/jpeg";
    content.push({
      type: "image_url",
      image_url: { url: `data:${mime};base64,${input.imageBase64}` },
    });
  }

  const site = process.env.NEXT_PUBLIC_APP_URL || "https://myvaultexchange.com";
  let lastError = "OpenRouter request failed";

  for (const model of OPENROUTER_MODELS) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": site,
        "X-OpenRouter-Title": "MyVaultExchange",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [{ role: "user", content }],
        ...(input.webSearch
          ? {
              plugins: [
                {
                  id: "web",
                  max_results: 6,
                  include_domains: ["ebay.com", "ebay.ca", "ebay.co.uk"],
                },
              ],
            }
          : {}),
      }),
      cache: "no-store",
    });
    const body = await response.text();
    if (response.status === 404) {
      lastError = geminiErrorMessage(404, body);
      continue;
    }
    if (!response.ok) {
      lastError = geminiErrorMessage(response.status, body);
      continue;
    }
    const json = JSON.parse(body) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content ?? "";
  }
  throw new Error(lastError);
}

export async function geminiGenerate(body: Record<string, unknown>): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  let lastError = "Gemini request failed";
  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    if (response.status === 404) {
      lastError = geminiErrorMessage(404, await response.text());
      continue;
    }
    if (!response.ok) {
      lastError = geminiErrorMessage(response.status, await response.text());
      continue;
    }
    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  }
  throw new Error(lastError);
}

export async function visionComplete(input: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  webSearch?: boolean;
}): Promise<string> {
  if (process.env.OPENROUTER_API_KEY) {
    return openRouterComplete(input);
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Set OPENROUTER_API_KEY in .env.local (OpenRouter → Keys).");
  }
  const parts: Array<Record<string, unknown>> = [{ text: input.prompt }];
  if (input.imageBase64) {
    parts.push({
      inline_data: { mime_type: input.mimeType || "image/jpeg", data: input.imageBase64 },
    });
  }
  return geminiGenerate({
    contents: [{ parts }],
    ...(input.webSearch ? { tools: [{ googleSearch: {} }] } : {}),
    generationConfig: { temperature: 0.2 },
  });
}

export function parseJsonObject<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  return JSON.parse(text.slice(start, end + 1)) as T;
}

export function parseJsonArray<T>(text: string): T[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) return [];
  const parsed = JSON.parse(text.slice(start, end + 1));
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}
