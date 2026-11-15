import { NextRequest, NextResponse } from "next/server";
import { Business, Claim, UUID, db, digest, ownerCookie } from "@/lib/nstp-directory";
export const runtime = "nodejs";
// Email scanners fetch links automatically. A GET must never consume a claim token.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const id = String(form.get("id") || "");
    const key = String(form.get("token") || "");
    if (!UUID.test(id) || key.length < 40 || key.length > 200)
      return NextResponse.redirect(new URL("/businesses?claim=invalid", req.url), 303);
    const rows = await db<Claim[]>("nstp_claim_requests", "GET", {
      id: "eq." + id, token_hash: "eq." + digest(key), status: "eq.invited", select: "*", limit: "1"
    });
    const row = rows[0];
    if (!row || !row.expires_at || new Date(row.expires_at).getTime() <= Date.now())
      return NextResponse.redirect(new URL("/businesses?claim=expired", req.url), 303);
    const claimed = await db<Claim[]>("nstp_claim_requests", "PATCH",
      { id: "eq." + row.id, status: "eq.invited", token_hash: "eq." + digest(key) },
      { status: "verified", token_hash: null, verified_at: new Date().toISOString() });
    if (!claimed.length) return NextResponse.redirect(new URL("/businesses?claim=expired", req.url), 303);
    await db("nstp_business_owners", "POST", { on_conflict: "business_id,email" },
      [{ business_id: row.business_id, email: row.email }],
      "resolution=merge-duplicates,return=representation");
    await db<Business[]>("nstp_businesses", "PATCH",
      { id: "eq." + row.business_id, claimed_at: "is.null" },
      { claimed_at: new Date().toISOString() });
    const response = NextResponse.redirect(new URL("/owner", req.url), 303);
    response.cookies.set("nstp_owner", ownerCookie(row.business_id, row.email), {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 7 * 86400
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/businesses?claim=error", req.url), 303);
  }
}
