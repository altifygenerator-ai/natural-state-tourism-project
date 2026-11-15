import { NextRequest, NextResponse } from "next/server";
import { Business, UUID, db, safePublicUrl } from "@/lib/nstp-directory";
import { isLikelyAutomated, recordBusinessInteraction } from "@/lib/nstp-metrics";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.redirect(new URL("/businesses", req.url), 302);
  try {
    const rows = await db<Business[]>("nstp_businesses", "GET", { id: "eq." + id,
      status: "eq.active", select: "id,website", limit: "1" });
    const website = rows[0]?.website;
    if (!website || !safePublicUrl(website)) return NextResponse.redirect(new URL("/businesses", req.url), 302);
    if (!isLikelyAutomated(req)) {
      const placement = req.nextUrl.searchParams.get("placement") || "directory";
      if (/^[a-zA-Z0-9._-]{1,60}$/.test(placement)) {
        try { await recordBusinessInteraction(req, id, "website_click", "naturalstatetourismproject.org", placement); }
        catch { /* Never block a legitimate business referral because analytics is unavailable. */ }
      }
    }
    return NextResponse.redirect(website, 302);
  } catch {
    return NextResponse.redirect(new URL("/businesses", req.url), 302);
  }
}
