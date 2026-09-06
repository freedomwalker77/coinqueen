import { catalog, type CatalogItem, type PieceType } from "./catalog";

export type IdentifyHints = {
  year?: string;
  country?: string;
  denomination?: string;
  type?: PieceType | "";
  text?: string;
};

export type IdentifyMatch = {
  item: CatalogItem;
  score: number;
  reasons: string[];
};

export type VisionGuess = {
  type?: PieceType;
  name?: string;
  year?: string;
  country?: string;
  denomination?: string;
  mint?: string;
  metal?: string;
  series?: string;
  notes?: string;
};

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9$.]+/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 1);
}

function includesLoose(hay: string, needle: string) {
  const n = needle.trim().toLowerCase();
  if (!n) return false;
  return hay.toLowerCase().includes(n);
}

export function scoreItem(item: CatalogItem, hints: IdentifyHints, vision?: VisionGuess): IdentifyMatch {
  let score = 0;
  const reasons: string[] = [];
  const blob = [
    item.name,
    item.shortName,
    item.country,
    item.denomination,
    item.series,
    item.mint ?? "",
    item.metal ?? "",
    ...item.keywords,
  ]
    .join(" ")
    .toLowerCase();

  const yearHint = hints.year || vision?.year;
  if (yearHint && item.year && String(item.year) === String(yearHint).slice(0, 4)) {
    score += 40;
    reasons.push(`Year ${item.year}`);
  }

  const countryHint = hints.country || vision?.country;
  if (countryHint && includesLoose(item.country, countryHint)) {
    score += 22;
    reasons.push(item.country);
  }

  const denomHint = hints.denomination || vision?.denomination;
  if (denomHint && (includesLoose(item.denomination, denomHint) || includesLoose(blob, denomHint))) {
    score += 24;
    reasons.push(item.denomination);
  }

  const typeHint = hints.type || vision?.type;
  if (typeHint && item.type === typeHint) {
    score += 12;
    reasons.push(item.type === "coin" ? "Coin" : "Paper money");
  }

  if (vision?.mint && item.mint && includesLoose(item.mint, vision.mint)) {
    score += 14;
    reasons.push(item.mint);
  }

  if (vision?.series && includesLoose(item.series, vision.series)) {
    score += 16;
    reasons.push(item.series);
  }

  const extra = [hints.text, vision?.name, vision?.series, vision?.metal, vision?.notes]
    .filter(Boolean)
    .join(" ");
  for (const token of tokens(extra)) {
    if (blob.includes(token)) {
      score += 8;
      if (reasons.length < 5) reasons.push(token);
    }
  }

  return { item, score, reasons: [...new Set(reasons)] };
}

export function matchCatalog(hints: IdentifyHints, vision?: VisionGuess, limit = 5): IdentifyMatch[] {
  return catalog
    .map((item) => scoreItem(item, hints, vision))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function identifyWithGemini(imageBase64: string, mimeType: string): Promise<VisionGuess | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const prompt = `You identify collectible coins and paper money from a photo.
Return ONLY compact JSON with keys:
type ("coin" or "note"), name, year (string or empty), country, denomination, mint, metal, series, notes.
If unsure, still guess the most likely circulating or collector type. No markdown.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini error ${response.status}`);
  }

  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) return { notes: text.slice(0, 240) };
  return JSON.parse(text.slice(start, end + 1)) as VisionGuess;
}
