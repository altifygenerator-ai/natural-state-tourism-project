import { NextRequest, NextResponse } from "next/server";
import { Business, Change, Claim, Contact, Outreach, UUID, adminAllowed, cleanChanges, db, digest, claimHtml, sendMail, token } from "@/lib/nstp-directory";
import { researchBusiness, sendClaimInvitations } from "@/lib/nstp-workflows";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [businesses, contacts, claims, changes, outreach] = await Promise.all([
      db<Business[]>("nstp_businesses", "GET", { select: "*", order: "city.asc,name.asc", limit: "750" }),
      db<Contact[]>("nstp_business_contacts", "GET", { select: "*", order: "researched_at.desc", limit: "500" }),
      db<Claim[]>("nstp_claim_requests", "GET", { select: "id,business_id,email,status,created_at", order: "created_at.desc", limit: "200" }),
      db<Change[]>("nstp_business_changes", "GET", { select: "*", order: "submitted_at.desc", limit: "200" }),
      db<Outreach[]>("nstp_outreach", "GET", { select: "*", order: "created_at.desc", limit: "500" })
    ]);
    return NextResponse.json({ businesses, contacts, claims, changes, outreach }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Directory database is not configured or unavailable." }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json() as { action?: string; id?: string; limit?: number };
    if (body.action === "send") return NextResponse.json(await sendClaimInvitations(body.limit));
    if (!UUID.test(body.id || "")) return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    const id = body.id as string;
    if (body.action === "research") return NextResponse.json(await researchBusiness(id));
    if (body.action === "approve-contact" || body.action === "reject-contact") {
      const rows = await db<Contact[]>("nstp_business_contacts", "GET", { id: "eq." + id, select: "*", limit: "1" });
      const contact = rows[0];
      if (!contact) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
      const unsub = await db<Contact[]>("nstp_business_contacts", "GET", { email: "eq." + contact.email, review_status: "eq.unsubscribed", select: "id", limit: "1" });
      if (unsub.length) return NextResponse.json({ error: "This email has opted out." }, { status: 409 });
      const yes = body.action === "approve-contact";
      await db("nstp_business_contacts", "PATCH", { id: "eq." + id },
        { review_status: yes ? "approved" : "rejected", claim_eligible: yes, approved_at: yes ? new Date().toISOString() : null });
      if (yes) await db("nstp_outreach", "POST", { on_conflict: "contact_id,campaign" },
        [{ contact_id: id, campaign: "free_claim_v1", status: "queued" }], "resolution=ignore-duplicates,return=minimal");
      else await db("nstp_outreach", "PATCH", { contact_id: "eq." + id, status: "eq.queued" }, { status: "cancelled" });
      return NextResponse.json({ message: yes ? "Contact approved and queued; no email sent." : "Contact rejected." });
    }
    if (body.action === "approve-claim") {
      const requests = await db<Claim[]>("nstp_claim_requests", "GET", { id: "eq." + id, status: "eq.pending", select: "*", limit: "1" });
      const claim = requests[0];
      if (!claim) return NextResponse.json({ error: "Pending request not found." }, { status: 404 });
      const businesses = await db<Business[]>("nstp_businesses", "GET", { id: "eq." + claim.business_id, select: "*", limit: "1" });
      if (!businesses.length) return NextResponse.json({ error: "Business not found." }, { status: 404 });
      const secret = token();
      const expiry = new Date(Date.now() + 86400000).toISOString();
      await db("nstp_claim_requests", "PATCH", { id: "eq." + id, status: "eq.pending" },
        { status: "invited", token_hash: digest(secret), expires_at: expiry });
      const link = "https://www.naturalstatetourismproject.org/api/directory/verify?id=" + id + "&token=" + encodeURIComponent(secret);
      try { await sendMail(claim.email, "Verify your listing: " + businesses[0].name, claimHtml(businesses[0], link)); }
      catch {
        await db("nstp_claim_requests", "PATCH", { id: "eq." + id }, { status: "pending", token_hash: null });
        return NextResponse.json({ error: "Mail configuration or delivery failed; request remains pending." }, { status: 503 });
      }
      // Do not add the address to promotional outreach merely because the owner requested access.
      return NextResponse.json({ message: "Verification email sent. Claim remains unverified until owner clicks the link." });
    }
    if (body.action === "approve-edit" || body.action === "reject-edit") {
      const requests = await db<Change[]>("nstp_business_changes", "GET", { id: "eq." + id, status: "eq.pending", select: "*", limit: "1" });
      const change = requests[0];
      if (!change) return NextResponse.json({ error: "Pending edit not found." }, { status: 404 });
      const yes = body.action === "approve-edit";
      if (yes) {
        const payload = cleanChanges(change.payload);
        if (!Object.keys(payload).length) return NextResponse.json({ error: "No valid changes." }, { status: 400 });
        await db("nstp_businesses", "PATCH", { id: "eq." + change.business_id }, { ...payload, updated_at: new Date().toISOString() });
        await db("nstp_audit", "POST", {}, [{ action: "business_edit_approved", business_id: change.business_id, actor: "admin", details: { edit_id: change.id, keys: Object.keys(payload) } }]);
      }
      await db("nstp_business_changes", "PATCH", { id: "eq." + id, status: "eq.pending" }, { status: yes ? "applied" : "rejected", reviewed_at: new Date().toISOString() });
      return NextResponse.json({ message: yes ? "Edits approved in the central directory." : "Edit request rejected." });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to complete action." }, { status: 503 });
  }
}
