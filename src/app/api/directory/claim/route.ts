import { NextRequest, NextResponse } from "next/server";
import { Business, Claim, Contact, UUID, claimHtml, db, digest, emailAddress, sendMail, token, requestFingerprint } from "@/lib/nstp-directory";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (data.website_extra) return NextResponse.json({ message: "Your request was received." });
    const businessId = String(data.businessId || "");
    const email = emailAddress(data.email);
    if (!UUID.test(businessId) || !email) return NextResponse.json({ error: "Enter a valid business and email address." }, { status: 400 });
    const business = await db<Business[]>("nstp_businesses", "GET", { id: "eq." + businessId, select: "*", limit: "1" });
    if (!business.length || business[0].status !== "active") return NextResponse.json({ error: "Listing unavailable." }, { status: 404 });
    const since = new Date(Date.now() - 86400000).toISOString();
    const fingerprint = requestFingerprint(req);
    if (fingerprint) {
      const requests = await db<{ id: string }[]>("nstp_claim_requests", "GET",
        { request_fingerprint: "eq." + fingerprint, created_at: "gte." + since, select: "id", limit: "16" });
      if (requests.length >= 15) return NextResponse.json({ error: "Request limit reached. Please try again tomorrow." }, { status: 429 });
    }
    const recent = await db<Claim[]>("nstp_claim_requests", "GET", { business_id: "eq." + businessId, email: "eq." + email, created_at: "gte." + since, select: "id", limit: "3" });
    if (recent.length >= 3) return NextResponse.json({ error: "Too many requests. Try again tomorrow." }, { status: 429 });
    const contacts = await db<Contact[]>("nstp_business_contacts", "GET", { business_id: "eq." + businessId, email: "eq." + email, review_status: "eq.approved", claim_eligible: "eq.true", select: "*", limit: "1" });
    if (!contacts.length) {
      await db("nstp_claim_requests", "POST", {}, [{ business_id: businessId, email, status: "pending", request_fingerprint: fingerprint }]);
      return NextResponse.json({ message: "Your ownership request was received. The team will review it before granting access." });
    }
    const secret = token();
    const expires = new Date(Date.now() + 86400000).toISOString();
    const created = await db<Claim[]>("nstp_claim_requests", "POST", {}, [{ business_id: businessId, email, status: "invited", token_hash: digest(secret), expires_at: expires, request_fingerprint: fingerprint }]);
    const verifyUrl = new URL("/api/directory/verify", "https://www.naturalstatetourismproject.org");
    verifyUrl.searchParams.set("id", created[0].id); verifyUrl.searchParams.set("token", secret);
    try { await sendMail(email, "Verify your listing: " + business[0].name, claimHtml(business[0], verifyUrl.toString())); }
    catch {
      await db("nstp_claim_requests", "PATCH", { id: "eq." + created[0].id }, { status: "pending", token_hash: null });
      return NextResponse.json({ error: "Verification email is not configured yet. Please contact us." }, { status: 503 });
    }
    return NextResponse.json({ message: "We sent a secure verification link to that business email." });
  } catch { return NextResponse.json({ error: "Unable to submit your request." }, { status: 500 }); }
}
