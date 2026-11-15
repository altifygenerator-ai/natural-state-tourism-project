import { NextResponse } from "next/server";
import { getAutomationControl, mailStartupReadiness } from "@/lib/nstp-automation";
export const runtime = "nodejs";

// Minimal health check: reveals only booleans, never addresses, API keys,
// signing secrets, recipient data, or campaign records.
export async function GET() {
  let signedSchedule = false;
  try { signedSchedule = (await getAutomationControl()).database_scheduler_enabled === true; }
  catch { signedSchedule = false; }
  return NextResponse.json({
    schedulerConfigured: Boolean(process.env.CRON_SECRET) || signedSchedule,
    senderConfigured: mailStartupReadiness() === null
  }, { headers: { "Cache-Control": "no-store" } });
}
