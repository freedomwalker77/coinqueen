import { NextResponse } from "next/server";
import { getItem, type PieceType } from "@/lib/catalog";
import { visionConfigured } from "@/lib/gemini";
import { identifyWithGemini, matchCatalog, type IdentifyHints, type IdentifyMatch } from "@/lib/identify";
import { liveComps, marketQueryFromVision } from "@/lib/liveComps";

async function withSoldRows(matches: IdentifyMatch[], query?: string) {
  return Promise.all(
    matches.slice(0, 3).map(async (row, index) => {
      const feeds = await liveComps(row.item, {
        query: index === 0 ? query : undefined,
        webSearch: index === 0,
      });
      return { ...row, ebay: feeds.ebay, heritage: feeds.heritage, forSale: feeds.forSale };
    }),
  );
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const sampleId = String(form.get("sampleId") ?? "");
    if (sampleId) {
      const item = getItem(sampleId);
      if (!item) {
        return NextResponse.json({ error: "Unknown sample" }, { status: 404 });
      }
      const [match] = await withSoldRows([{ item, score: 100, reasons: ["Sample scan"] }]);
      return NextResponse.json({
        matches: [match],
        vision: null,
        usedAi: false,
        message: "Sample piece loaded from the MyVaultExchange catalog.",
      });
    }

    const hints: IdentifyHints = {
      year: String(form.get("year") ?? ""),
      country: String(form.get("country") ?? ""),
      denomination: String(form.get("denomination") ?? ""),
      type: (String(form.get("type") ?? "") as PieceType | "") || "",
    };

    const image = form.get("image");
    let vision = null;
    let usedAi = false;
    let message: string | undefined;

    if (image instanceof File && image.size > 0 && visionConfigured()) {
      const buffer = Buffer.from(await image.arrayBuffer());
      vision = await identifyWithGemini(buffer.toString("base64"), image.type || "image/jpeg");
      usedAi = true;
    } else if (image instanceof File && image.size > 0 && !visionConfigured()) {
      message =
        "Photo saved, but photo ID is off. Add OPENROUTER_API_KEY in .env.local (openrouter.ai/settings/keys), restart npm run dev, then scan again.";
    }

    const limit = form.get("queue") ? 1 : 3;
    const matches = await withSoldRows(
      matchCatalog(hints, vision ?? undefined).slice(0, limit),
      marketQueryFromVision(vision ?? undefined),
    );
    if (matches.length === 0) {
      message =
        message ??
        "Nothing scored high enough. Try year + denomination, or use a sample scan to see the flow.";
    }

    return NextResponse.json({ matches, vision, usedAi, message });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Identify failed";
    return NextResponse.json({ error: text }, { status: 500 });
  }
}
