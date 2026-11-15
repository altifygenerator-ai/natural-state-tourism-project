import { NextRequest, NextResponse } from "next/server";
import { adminAllowed, db } from "@/lib/nstp-directory";
export const runtime = "nodejs";
function csvValue(value: string | number | null | undefined) {
  const raw = String(value ?? "");
  const sanitized = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + sanitized.replace(/"/g, '""') + '"';
}
export async function GET(req: NextRequest) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const month = req.nextUrl.searchParams.get("month") || "";
  const kind = req.nextUrl.searchParams.get("kind") || "business";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !["business","site"].includes(kind))
    return NextResponse.json({ error: "Invalid month or report type." }, { status: 400 });
  const date = month + "-01";
  if (date >= new Date().toISOString().slice(0,7) + "-01")
    return NextResponse.json({ error: "Only completed months have final reports." }, { status: 400 });
  try {
    let lines: Array<Array<string | number | null | undefined>>;
    if (kind === "site") {
      const rows = await db<{ site: string; month: string; tracked_pageviews: number }[]>(
        "nstp_monthly_site_stats", "GET",
        { month: "eq." + date, select: "site,month,tracked_pageviews", order: "site.asc", limit: "15" });
      lines = [["month","site","tracked_pageviews"], ...rows.map(x => [x.month,x.site,x.tracked_pageviews])];
    } else {
      const [stats, businesses] = await Promise.all([
        db<{ business_id: string; month: string; profile_views: number; website_clicks: number; phone_clicks: number }[]>(
          "nstp_monthly_business_stats","GET",{ month:"eq."+date, select:"*",limit:"2000" }),
        db<{ id: string; name: string; city: string; placement_type: string }[]>(
          "nstp_businesses","GET",{ select:"id,name,city,placement_type",limit:"2000" })
      ]);
      const info = new Map(businesses.map(b=>[b.id,b]));
      lines = [["month","city","business","placement_type","profile_views","website_clicks","phone_clicks"],
        ...stats.map(x=>[x.month,info.get(x.business_id)?.city||"",info.get(x.business_id)?.name||"",
          info.get(x.business_id)?.placement_type||"",x.profile_views,x.website_clicks,x.phone_clicks])];
    }
    const csv = lines.map(row=>row.map(csvValue).join(",")).join("\r\n")+"\r\n";
    return new NextResponse(csv, { status: 200, headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nstp-' + kind + '-reach-' + month + '.csv"',
      "Cache-Control": "private, no-store"
    } });
  } catch {
    return NextResponse.json({ error: "Unable to export monthly report." }, { status: 503 });
  }
}
