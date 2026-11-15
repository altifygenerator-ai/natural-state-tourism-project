import { NextRequest, NextResponse } from "next/server";
import { allowedSite, corsHeaders, isLikelyAutomated, matchOfficialBusiness,
  recordBusinessInteraction, recordSiteView } from "@/lib/nstp-metrics";
import { Business, UUID, db } from "@/lib/nstp-directory";
export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!allowedSite(origin)) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const site = allowedSite(origin);
  if (!site) return NextResponse.json({ error: "Origin is not an official guide." }, { status: 403 });
  const headers = corsHeaders(origin);
  if (isLikelyAutomated(req)) return NextResponse.json({ accepted: false }, { headers });
  try {
    const raw = await req.text();
    if (raw.length > 1100) return NextResponse.json({ error: "Payload too large." }, { status: 413, headers });
    const body = JSON.parse(raw) as {
      event?: string; path?: string; business_id?: string; placement?: string; href?: string;
    };
    const placement = typeof body.placement === "string" && /^[a-zA-Z0-9._-]{1,60}$/.test(body.placement)
      ? body.placement : "directory";
    if (body.event === "site_view") {
      const path = typeof body.path === "string" ? body.path.split("?")[0].split("#")[0] : "";
      return NextResponse.json({ accepted: await recordSiteView(req, site, path) }, { headers });
    }
    let businessId = body.business_id;
    if (body.event === "website_click" && !businessId && typeof body.href === "string") {
      const match = await matchOfficialBusiness(site, body.href);
      businessId = match?.id;
    }
    if (!businessId || !UUID.test(businessId) || !["profile_view","website_click","phone_click"].includes(body.event || "")) {
      return NextResponse.json({ accepted: false }, { headers });
    }
    if (site !== "naturalstatetourismproject.org") {
      // Prevent someone on one city guide from inflating unrelated city listings.
      const cityForSite: Record<string, string> = {
        "glenwoodarkansas.org": "Glenwood", "hotspringsarkansas.org": "Hot Springs",
        "mountidaarkansas.org": "Mount Ida", "murfreesboroarkansas.org": "Murfreesboro",
        "amityarkansas.org": "Amity"
      };
      const rows = await db<Business[]>("nstp_businesses", "GET", { id: "eq." + businessId,
        city: "eq." + cityForSite[site], select: "id", limit: "1" });
      if (!rows.length) return NextResponse.json({ accepted: false }, { headers });
    }
    const type = body.event as "profile_view" | "website_click" | "phone_click";
    return NextResponse.json({ accepted: await recordBusinessInteraction(req, businessId, type, site, placement) }, { headers });
  } catch {
    return NextResponse.json({ accepted: false }, { headers });
  }
}
