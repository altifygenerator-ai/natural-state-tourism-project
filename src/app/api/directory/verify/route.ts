import { NextRequest, NextResponse } from "next/server";
import { Business, Claim, UUID, db, digest, ownerCookie } from "@/lib/nstp-directory";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  const key = req.nextUrl.searchParams.get("token") || "";
  if (!UUID.test(id) || key.length < 40) return NextResponse.redirect(new URL("/businesses?claim=invalid", req.url));
  try {
    const rows = await db<Claim[]>("nstp_claim_requests", "GET", { id: "eq." + id, token_hash: "eq." + digest(key), status: "eq.invited", select: "*", limit: "1" });
    const row = rows[0];
    if (!row || !row.expires_at || new Date(row.expires_at).getTime() <= Date.now()) return NextResponse.redirect(new URL("/businesses?claim=expired", req.url));
    const claimed = await db<Claim[]>("nstp_claim_requests", "PATCH", { id: "eq." + row.id, status: "eq.invited", token_hash: "eq." + digest(key) },
      { status: "verified", token_hash: null, verified_at: new Date().toISOString() });
    if (!claimed.length) return NextResponse.redirect(new URL("/businesses?claim=expired", req.url));
    await db("nstp_business_owners", "POST", { on_conflict: "business_id,email" },
      [{ business_id: row.business_id, email: row.email }], "resolution=merge-duplicates,return=representation");
    await db<Business[]>("nstp_businesses", "PATCH", { id: "eq." + row.business_id, claimed_at: "is.null" },
      { claimed_at: new Date().toISOString() });
    const response = NextResponse.redirect(new URL("/owner", req.url));
    response.cookies.set("nstp_owner", ownerCookie(row.business_id, row.email), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
    return response;
  } catch { return NextResponse.redirect(new URL("/businesses?claim=error", req.url)); }
}
