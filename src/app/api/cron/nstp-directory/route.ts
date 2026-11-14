import { NextRequest, NextResponse } from "next/server";
import { Business, db } from "@/lib/nstp-directory";
import { researchBusiness, sendClaimInvitations } from "@/lib/nstp-workflows";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: NextRequest) {
  const cron = process.env.CRON_SECRET;
  if (!cron || req.headers.get("authorization") !== "Bearer " + cron) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status: { researched: number; discovered: number; sent: number; errors: number } = { researched: 0, discovered: 0, sent: 0, errors: 0 };
  if (process.env.NSTP_RESEARCH_ENABLED === "true") {
    const olderThan = new Date(Date.now() - 30 * 86400000).toISOString();
    const businesses = await db<Business[]>("nstp_businesses", "GET", {
      select: "id,name,city,website", website: "not.is.null", status: "eq.active",
      or: "(last_researched_at.is.null,last_researched_at.lt." + olderThan + ")",
      order: "last_researched_at.asc.nullsfirst", limit: "5" });
    for (const business of businesses) {
      try { const done = await researchBusiness(business.id); status.researched++; status.discovered += done.added; }
      catch { status.errors++; }
    }
  }
  if (process.env.NSTP_OUTREACH_ENABLED === "true") {
    try { const sent = await sendClaimInvitations(5); status.sent = sent.sent; status.errors += sent.failed; }
    catch { status.errors++; }
  }
  return NextResponse.json({ status });
}
