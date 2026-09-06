import { NextResponse } from "next/server";
import { getItem, type PieceType } from "@/lib/catalog";
import { identifyWithGemini, matchCatalog, type IdentifyHints } from "@/lib/identify";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const sampleId = String(form.get("sampleId") ?? "");
    if (sampleId) {
      const item = getItem(sampleId);
      if (!item) {
        return NextResponse.json({ error: "Unknown sample" }, { status: 404 });
      }
      return NextResponse.json({
        matches: [{ item, score: 100, reasons: ["Sample scan"] }],
        vision: null,
        usedAi: false,
        message: "Sample piece loaded from the CoinQueen catalog.",
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

    if (image instanceof File && image.size > 0 && process.env.GEMINI_API_KEY) {
      const buffer = Buffer.from(await image.arrayBuffer());
      vision = await identifyWithGemini(buffer.toString("base64"), image.type || "image/jpeg");
      usedAi = true;
    } else if (image instanceof File && image.size > 0 && !process.env.GEMINI_API_KEY) {
      message =
        "Photo saved for this session, but GEMINI_API_KEY is not set — matching from the fields you entered.";
    }

    const matches = matchCatalog(hints, vision ?? undefined);
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
