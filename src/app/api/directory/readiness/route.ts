import { NextResponse } from "next/server";
import { mailStartupReadiness } from "@/lib/nstp-automation";
export const runtime = "nodejs";

// Minimal health check: reveals only booleans, never addresses, API keys,
// signing secrets, recipient data, or campaign records.
export async function GET() {
  return NextResponse.json({
    schedulerConfigured: Boolean(process.env.CRON_SECRET),
    senderConfigured: mailStartupReadiness() === null
  }, { headers: { "Cache-Control": "no-store" } });
}
