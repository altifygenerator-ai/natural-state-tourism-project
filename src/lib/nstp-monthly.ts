import { db, emailAddress, escapeHtml, ORIGIN, rpc, sendMail } from "@/lib/nstp-directory";

type ReportJob = {
  id: string; business_id: string; email: string; month: string; status: string;
};
type ReportStats = { month: string; profile_views: number; website_clicks: number; phone_clicks: number };
const CITY_SITES: Record<string, string> = {
  "Glenwood": "glenwoodarkansas.org",
  "Hot Springs": "hotspringsarkansas.org",
  "Mount Ida": "mountidaarkansas.org",
  "Murfreesboro": "murfreesboroarkansas.org",
  "Amity": "amityarkansas.org"
};
export function lastCompletedMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    .toISOString().slice(0, 10);
}
export function reportHtml(name: string, city: string, month: string,
  stats: ReportStats, sitePageviews: number | null, businessId: string) {
  const monthName = new Date(month + "T12:00:00Z").toLocaleString("en-US", {
    month: "long", year: "numeric", timeZone: "UTC"
  });
  const profile = Number(stats.profile_views) || 0;
  const website = Number(stats.website_clicks) || 0;
  const phone = Number(stats.phone_clicks) || 0;
  const guide = sitePageviews === null ? "" :
    '<p>The ' + escapeHtml(city) + ' guide also recorded <strong>' +
    sitePageviews.toLocaleString("en-US") + '</strong> tracked pageviews. ' +
    'Those are visits across the guide, <strong>not</strong> visits to your individual business.</p>';
  return '<div style="background:#f7f3e9;padding:28px;font-family:Arial,sans-serif;color:#233d2d">' +
    '<div style="max-width:550px;margin:0 auto;background:#fff;border-radius:12px;padding:30px">' +
    '<h2 style="margin-top:0;font-size:18px;letter-spacing:1px">NATURAL STATE TOURISM PROJECT</h2>' +
    '<h1 style="font-size:25px">' + escapeHtml(monthName) + ' — your listing report</h1>' +
    '<p>Here are the interactions we recorded for <strong>' + escapeHtml(name) + '</strong>:</p>' +
    '<table style="width:100%;border-collapse:collapse">' +
    '<tr><td style="padding:9px 0">Business profile views</td><td style="text-align:right"><strong>' + profile + '</strong></td></tr>' +
    '<tr><td style="padding:9px 0">Clicks to your website</td><td style="text-align:right"><strong>' + website + '</strong></td></tr>' +
    '<tr><td style="padding:9px 0">Phone-link clicks</td><td style="text-align:right"><strong>' + phone + '</strong></td></tr></table>' +
    guide +
    '<p style="font-size:12px;color:#667366">Counts reflect recorded, deduplicated interactions; they do not prove unique visitors, leads, bookings, or sales. Tracking began when the links were installed and historical traffic is not reconstructed.</p>' +
    '<p><a href="' + ORIGIN + '/claim/' + encodeURIComponent(businessId) +
    '" style="background:#203e2e;color:#fff;padding:13px 18px;text-decoration:none;border-radius:6px;display:inline-block">Manage my listing</a></p>' +
    '<p style="font-size:12px;color:#687667">You opted into monthly listing reports. You can turn them off from your owner dashboard.</p>' +
    '</div></div>';
}
export async function finalizePreviousMonth() {
  const target = lastCompletedMonth();
  return rpc<{ month: string; business_snapshots: number; site_snapshots: number; report_emails_queued: number }>(
    "nstp_finalize_month", { p_month: target });
}
export async function sendMonthlyReports(limit = 5) {
  if (process.env.NSTP_MONTHLY_REPORTS_ENABLED !== "true") return { sent: 0, failed: 0, skipped: 0 };
  if (!process.env.RESEND_API_KEY || !process.env.NSTP_MAIL_FROM ||
      !process.env.NSTP_SUPABASE_SECRET_KEY) throw Error("Monthly report sender is not configured");
  const pending = await db<ReportJob[]>("nstp_monthly_report_deliveries", "GET", {
    status: "eq.queued", order: "created_at.asc", limit: String(Math.max(0,Math.min(limit,5))), select: "*"
  });
  let sent = 0, failed = 0, skipped = 0;
  for (const item of pending) {
    const reserved = await db<ReportJob[]>("nstp_monthly_report_deliveries", "PATCH",
      { id: "eq." + item.id, status: "eq.queued" }, { status: "sending" });
    if (!reserved.length) continue;
    try {
      const [owner, business, stat, suppressed] = await Promise.all([
        db<{ monthly_report_opt_in: boolean }[]>("nstp_business_owners", "GET",
          { business_id: "eq." + item.business_id, email: "eq." + item.email,
            select: "monthly_report_opt_in", limit: "1" }),
        db<{ name: string; city: string; status: string }[]>("nstp_businesses", "GET",
          { id: "eq." + item.business_id, select: "name,city,status", limit: "1" }),
        db<ReportStats[]>("nstp_monthly_business_stats", "GET",
          { business_id: "eq." + item.business_id, month: "eq." + item.month,
            select: "month,profile_views,website_clicks,phone_clicks", limit: "1" }),
        db<{ email: string }[]>("nstp_suppression", "GET", {
          email: "eq." + item.email, select: "email", limit: "1"
        })
      ]);
      if (!owner[0]?.monthly_report_opt_in || !business[0] || business[0].status !== "active" ||
          !emailAddress(item.email) || suppressed.length || !stat[0]) {
        await db("nstp_monthly_report_deliveries", "PATCH", { id: "eq." + item.id },
          { status: "cancelled", error: "Not eligible or opted out" });
        skipped++; continue;
      }
      const b = business[0], site = CITY_SITES[b.city];
      const monthSite = site ? await db<{ tracked_pageviews: number }[]>("nstp_monthly_site_stats", "GET",
        { site: "eq." + site, month: "eq." + item.month,
          select: "tracked_pageviews", limit: "1" }) : [];
      const tracked = monthSite.length ? monthSite[0].tracked_pageviews : null;
      const html = reportHtml(b.name,b.city,item.month,stat[0],tracked,item.business_id);
      const resp = await sendMail(item.email, "Your Natural State listing report — " + item.month.slice(0,7),
        html, { idempotencyKey: "nstp-report-" + item.id });
      await db("nstp_monthly_report_deliveries", "PATCH", { id: "eq." + item.id },
        { status: "sent", sent_at: new Date().toISOString(), provider_id: resp.id || null, error: null });
      sent++;
    } catch (err) {
      await db("nstp_monthly_report_deliveries", "PATCH", { id: "eq." + item.id },
        { status: "failed", error: err instanceof Error ? err.message.slice(0,150) : "Unknown error" });
      failed++;
    }
  }
  return { sent, failed, skipped };
}
