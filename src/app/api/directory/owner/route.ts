import { NextRequest, NextResponse } from "next/server";
import { Business, UUID, cleanChanges, db, ownerFromRequest, rpc } from "@/lib/nstp-directory";
export const runtime = "nodejs";

type OwnerRow = { email: string; business_id: string; monthly_report_opt_in: boolean };
function sameOrigin(req: NextRequest) {
  const origin = req.headers?.get("origin");
  return !origin || origin === req.nextUrl?.origin;
}
async function verifiedOwner(req: NextRequest) {
  const session = ownerFromRequest(req);
  if (!session || !UUID.test(session.b)) return null;
  const rows = await db<OwnerRow[]>("nstp_business_owners", "GET", {
    business_id: "eq." + session.b, email: "eq." + session.e,
    select: "email,business_id,monthly_report_opt_in", limit: "1"
  });
  return rows.length ? { session, owner: rows[0] } : null;
}
export async function GET(req: NextRequest) {
  try {
    const verified = await verifiedOwner(req);
    if (!verified) return NextResponse.json({ error: "Please verify your business email again." }, { status: 401 });
    const businesses = await db<Business[]>("nstp_businesses", "GET", {
      id: "eq." + verified.session.b, select: "*", limit: "1"
    });
    const business = businesses[0];
    if (!business) return NextResponse.json({ error: "Listing unavailable." }, { status: 404 });
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 86400000);
    const siteForCity: Record<string, string> = {
      Glenwood: "glenwoodarkansas.org", "Hot Springs": "hotspringsarkansas.org",
      "Mount Ida": "mountidaarkansas.org", Murfreesboro: "murfreesboroarkansas.org",
      Amity: "amityarkansas.org"
    };
    const [metrics, history, siteHistory] = await Promise.all([
      rpc<{ profile_views: number; website_clicks: number; phone_clicks: number }>(
        "nstp_business_metric_summary",
        { p_business_id: business.id, p_start: from.toISOString(), p_end: now.toISOString() }),
      db<{ month: string; profile_views: number; website_clicks: number; phone_clicks: number }[]>(
        "nstp_monthly_business_stats", "GET",
        { business_id: "eq." + business.id, select: "month,profile_views,website_clicks,phone_clicks",
          order: "month.desc", limit: "6" }),
      siteForCity[business.city]
        ? db<{ month: string; tracked_pageviews: number }[]>("nstp_monthly_site_stats", "GET",
          { site: "eq." + siteForCity[business.city], select: "month,tracked_pageviews",
            order: "month.desc", limit: "6" }) : Promise.resolve([])
    ]);
    return NextResponse.json({ business, email: verified.session.e,
      monthlyReportOptIn: verified.owner.monthly_report_opt_in, metrics, history, siteHistory },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load your listing." }, { status: 503 });
  }
}
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const verified = await verifiedOwner(req);
    if (!verified) return NextResponse.json({ error: "Verify your email again." }, { status: 401 });
    const body = await req.json();
    if (typeof body.monthlyReportOptIn !== "boolean")
      return NextResponse.json({ error: "Invalid preference." }, { status: 400 });
    await db("nstp_business_owners", "PATCH", {
      business_id: "eq." + verified.session.b, email: "eq." + verified.session.e
    }, { monthly_report_opt_in: body.monthlyReportOptIn });
    return NextResponse.json({ message: body.monthlyReportOptIn
      ? "Monthly email reports enabled. You can turn them off anytime."
      : "Monthly email reports disabled.", monthlyReportOptIn: body.monthlyReportOptIn });
  } catch {
    return NextResponse.json({ error: "Unable to update report preference." }, { status: 503 });
  }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const verified = await verifiedOwner(req);
    if (!verified) return NextResponse.json({ error: "Session expired. Verify your email again." }, { status: 401 });
    const payload = cleanChanges(await req.json());
    if (!Object.keys(payload).length) return NextResponse.json({ error: "No valid changes supplied." }, { status: 400 });
    const existing = await db<{ id: string }[]>("nstp_business_changes", "GET", {
      business_id: "eq." + verified.session.b, status: "eq.pending", select: "id", limit: "5" });
    if (existing.length >= 5) return NextResponse.json({
      error: "Please wait for your previous submissions to be reviewed."
    }, { status: 429 });
    await db("nstp_business_changes", "POST", {}, [{
      business_id: verified.session.b, submitted_by: verified.session.e,
      payload, status: "pending"
    }]);
    return NextResponse.json({ message: "Your edits are submitted for review. They will appear after approval." });
  } catch {
    return NextResponse.json({ error: "Unable to submit your changes." }, { status: 503 });
  }
}
