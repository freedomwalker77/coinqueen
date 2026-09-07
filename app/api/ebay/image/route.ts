import { NextResponse } from "next/server";
import { isEbayImageHost } from "@/lib/ebayImage";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u");
  if (!raw) return NextResponse.json({ error: "Missing image" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Bad image URL" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !isEbayImageHost(target.hostname)) {
    return NextResponse.json({ error: "Unsupported image host" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    headers: { Referer: "https://www.ebay.com/", Accept: "image/*" },
    next: { revalidate: 86400 },
  });
  if (!upstream.ok) {
    return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Not an image" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
