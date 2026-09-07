import { pingGhl } from "@/lib/ghl";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(await pingGhl());
}
