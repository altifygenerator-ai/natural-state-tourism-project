import { NextRequest, NextResponse } from "next/server";
import { Business, db } from "@/lib/nstp-directory";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const city = req.nextUrl.searchParams.get("city");
    const params: Record<string, string> = { status: "eq.active", select: "id,name,slug,city,category,description,phone,address,website,image_url,listing_url,hours,featured,placement_type,updated_at", order: "name.asc", limit: "500" };
    if (city && ["Glenwood", "Hot Springs", "Mount Ida", "Murfreesboro", "Amity"].includes(city)) params.city = "eq." + city;
    const businesses = await db<Partial<Business>[]>("nstp_businesses", "GET", params);
    return NextResponse.json({ businesses }, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" } });
  } catch { return NextResponse.json({ error: "Directory temporarily unavailable." }, { status: 503 }); }
}
