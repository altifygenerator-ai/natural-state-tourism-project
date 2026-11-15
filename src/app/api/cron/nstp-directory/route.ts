import { NextRequest, NextResponse } from "next/server";
import { Business, db } from "@/lib/nstp-directory";
import { researchBusiness, sendClaimInvitations } from "@/lib/nstp-workflows";
import { finalizePreviousMonth, sendMonthlyReports } from "@/lib/nstp-monthly";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cron = process.env.CRON_SECRET;
  if (!cron || req.headers.get("authorization") !== "Bearer " + cron)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = { researched: 0, discovered: 0, autoQueued: 0, sent: 0, failed: 0, errors: 0,
    reportsQueued: 0, reportsSent: 0 };
  if (process.env.NSTP_RESEARCH_ENABLED === "true") {
    const olderThan = new Date(Date.now() - 30 * 86400000).toISOString();
    try {
      const businesses = await db<Business[]>("nstp_businesses", "GET", {
        select: "id,name,city,website", website: "not.is.null", status: "eq.active",
        or: "(last_researched_at.is.null,last_researched_at.lt." + olderThan + ")",
        order: "last_researched_at.asc.nullsfirst", limit: "5"
      });
      const results = await Promise.allSettled(businesses.map(b => researchBusiness(b.id)));
      for (const result of results) {
        if (result.status === "fulfilled") {
          status.researched++; status.discovered += result.value.added;
          status.autoQueued += result.value.queued;
        } else status.errors++;
      }
    } catch { status.errors++; }
  }
  if (process.env.NSTP_OUTREACH_ENABLED === "true") {
    try {
      const result = await sendClaimInvitations(5);
      status.sent = result.sent; status.failed = result.failed; status.errors += result.failed;
    } catch { status.errors++; }
  }
  if (process.env.NSTP_MONTHLY_REPORTS_ENABLED === "true") {
    // Create last month's snapshots on the first three UTC days.
    if (new Date().getUTCDate() <= 3) {
      try {
        const snapshot = await finalizePreviousMonth();
        status.reportsQueued = snapshot.report_emails_queued;
      } catch { status.errors++; }
    }
    try {
      const monthly = await sendMonthlyReports(5);
      status.reportsSent = monthly.sent;
      status.errors += monthly.failed;
    } catch { status.errors++; }
  }
  return NextResponse.json({ status }, { headers: { "Cache-Control": "no-store" } });
}
