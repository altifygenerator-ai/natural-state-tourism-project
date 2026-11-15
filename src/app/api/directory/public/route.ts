import { NextRequest, NextResponse } from "next/server";
import { Business, cleanChanges, db } from "@/lib/nstp-directory";
export const runtime = "nodejs";

// Public sync includes ONLY approved and sanitized listing fields.
// Pending claims, owner addresses, contact research and admin notes never leave this API.
type ApprovedChange = { business_id: string; payload: Record<string, unknown> };
type SyncedBusiness = Partial<Business> & {
  approved_overrides: Record<string, string>;
};
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const allowedCities = ["Glenwood","Hot Springs","Mount Ida","Murfreesboro","Amity"];
  if (city && !allowedCities.includes(city)) return NextResponse.json({ error: "Invalid city." }, { status: 400 });
  try {
    const params: Record<string, string> = {
      status: "eq.active",
      select: "id,name,slug,source_site,source_key,city,category,description,phone,address,website,image_url,listing_url,hours,featured,placement_type,updated_at",
      order: "name.asc", limit: "500"
    };
    if (city) params.city = "eq." + city;
    const businesses = await db<Partial<Business>[]>("nstp_businesses", "GET", params);
    const ids = new Set(businesses.map(b => b.id));
    const applied = await db<ApprovedChange[]>("nstp_business_changes", "GET", {
      status: "eq.applied", select: "business_id,payload",
      order: "reviewed_at.asc", limit: "4000"
    });
    const approved = new Map<string, Record<string, string>>();
    for (const change of applied) {
      if (!ids.has(change.business_id)) continue;
      const safe = cleanChanges(change.payload);
      if (!Object.keys(safe).length) continue;
      approved.set(change.business_id, { ...(approved.get(change.business_id) || {}), ...safe });
    }
    const result: SyncedBusiness[] = businesses.map(b => ({
      ...b, approved_overrides: approved.get(b.id || "") || {}
    }));
    return NextResponse.json({ businesses: result }, { headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300"
    }});
  } catch {
    return NextResponse.json({ error: "Directory temporarily unavailable." }, { status: 503 });
  }
}
