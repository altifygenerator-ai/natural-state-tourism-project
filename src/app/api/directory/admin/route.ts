import { attemptFirstMailTest, getAutomationControl, mailStartupReadiness } from "@/lib/nstp-automation";
import { NextRequest, NextResponse } from "next/server";
import { Business, Change, Claim, Contact, Outreach, UUID, ADMIN_SESSION_COOKIE, ADMIN_SESSION_SECONDS, adminAllowed, adminKeyAllowed, adminSessionCookie, cleanChanges, db, digest, claimHtml, mailFrom, sendMail, token } from "@/lib/nstp-directory";
import { researchBusiness, sendClaimInvitations, suppressEmail } from "@/lib/nstp-workflows";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [businesses, contacts, claims, changes, outreach, siteMonthly, monthlyDeliveries, automation] = await Promise.all([
      db<Business[]>("nstp_businesses", "GET", { select: "*", order: "city.asc,name.asc", limit: "750" }),
      db<Contact[]>("nstp_business_contacts", "GET", { select: "*", order: "researched_at.desc", limit: "500" }),
      db<Claim[]>("nstp_claim_requests", "GET", { select: "id,business_id,email,status,created_at", order: "created_at.desc", limit: "200" }),
      db<Change[]>("nstp_business_changes", "GET", { select: "*", order: "submitted_at.desc", limit: "200" }),
      db<Outreach[]>("nstp_outreach", "GET", { select: "*", order: "created_at.desc", limit: "500" }),
      db<{ site: string; month: string; tracked_pageviews: number }[]>("nstp_monthly_site_stats", "GET",
        { select: "site,month,tracked_pageviews", order: "month.desc", limit: "72" }),
      db<{ id: string; month: string; status: string }[]>("nstp_monthly_report_deliveries", "GET",
        { select: "id,month,status", order: "created_at.desc", limit: "500" }),
      getAutomationControl()
    ]);
    const settings = {
      dbConfigured: Boolean(process.env.NSTP_SUPABASE_SECRET_KEY && process.env.NSTP_SUPABASE_URL),
      senderConfigured: Boolean(process.env.RESEND_API_KEY),
      senderIdentity: (() => { try { return mailFrom(); } catch { return "Sender misconfigured"; } })(),
      postalConfigured: Boolean(process.env.NSTP_POSTAL_ADDRESS),
      webhookConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET),
      testRecipientConfigured: Boolean(process.env.NSTP_TEST_EMAIL),
      researchEnabled: automation.research_enabled,
      outreachEnabled: automation.outreach_requested && automation.mail_test_status === "delivered",
      monthlyReportsEnabled: process.env.NSTP_MONTHLY_REPORTS_ENABLED === "true",
      roleContactAutoApprove: process.env.NSTP_AUTO_APPROVE_ROLE_CONTACTS !== "false",
      automation,
      testReadiness: mailStartupReadiness()
    };
    const response = NextResponse.json({ businesses, contacts, claims, changes, outreach, siteMonthly, monthlyDeliveries, settings },
      { headers: { "Cache-Control": "private, no-store" } });
    // The admin key is used once to create a short-lived HttpOnly session.
    if (adminKeyAllowed(req)) response.cookies.set(ADMIN_SESSION_COOKIE, adminSessionCookie(), {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "strict", maxAge: ADMIN_SESSION_SECONDS, path: "/"
    });
    return response;
  } catch { return NextResponse.json({ error: "Directory database is not configured or unavailable." }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json() as { action?: string; id?: string; limit?: number };
    if (body.action === "logout") {
      const response = NextResponse.json({ message: "Signed out" });
      response.cookies.set(ADMIN_SESSION_COOKIE, "", {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "strict", path: "/", maxAge: 0
      });
      return response;
    }
    if (body.action === "pause-automation" || body.action === "resume-automation") {
      const on = body.action === "resume-automation";
      await db("nstp_automation_control", "PATCH", { id: "eq.1" }, {
        outreach_requested: on, research_enabled: on, updated_at: new Date().toISOString()
      });
      return NextResponse.json({ message: on ? "Automatic research and outreach resumed. Business emails still require a delivered test." : "Automatic research and business invitations paused." });
    }
    if (body.action === "start-mail-test") {
      return NextResponse.json(await attemptFirstMailTest());
    }
    if (body.action === "send") return NextResponse.json(await sendClaimInvitations(body.limit));
    if (body.action === "test-mail") return NextResponse.json(await attemptFirstMailTest());
    if (body.action === "research-batch") {
      const olderThan = new Date(Date.now() - 30 * 86400000).toISOString();
      const targets = await db<Business[]>("nstp_businesses", "GET",
        { select: "id", website: "not.is.null", status: "eq.active",
          or: "(last_researched_at.is.null,last_researched_at.lt." + olderThan + ")",
          order: "last_researched_at.asc.nullsfirst", limit: "5" });
      const results = await Promise.allSettled(targets.map(b => researchBusiness(b.id)));
      const success = results.filter(r => r.status === "fulfilled");
      const added = success.reduce((sum, r) => sum + (r.status === "fulfilled" ? r.value.added : 0), 0);
      const queued = success.reduce((sum, r) => sum + (r.status === "fulfilled" ? r.value.queued : 0), 0);
      return NextResponse.json({ message: "Research checked " + success.length + " businesses, found " + added +
          " new contacts and queued " + queued + " eligible business inboxes. No emails sent.",
        errors: results.length - success.length });
    }
    if (!UUID.test(body.id || "")) return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    const id = body.id as string;
    if (body.action === "research") return NextResponse.json(await researchBusiness(id));
    if (body.action === "suppress-contact") {
      const match = await db<Contact[]>("nstp_business_contacts", "GET", { id: "eq." + id, select: "*", limit: "1" });
      if (!match.length) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
      await suppressEmail(match[0].email, "manual");
      return NextResponse.json({ message: "This address is suppressed across the whole network." });
    }
    if (body.action === "approve-contact" || body.action === "reject-contact") {
      const rows = await db<Contact[]>("nstp_business_contacts", "GET", { id: "eq." + id, select: "*", limit: "1" });
      const contact = rows[0];
      if (!contact) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
      const unsub = await db<Contact[]>("nstp_business_contacts", "GET", { email: "eq." + contact.email, review_status: "eq.unsubscribed", select: "id", limit: "1" });
      const suppressed = await db<{ email: string }[]>("nstp_suppression", "GET",
        { email: "eq." + contact.email, select: "email", limit: "1" });
      if (unsub.length || suppressed.length) return NextResponse.json({ error: "This email is suppressed." }, { status: 409 });
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
      const link = "https://www.naturalstatetourismproject.org/verify-business?id=" + id + "&token=" + encodeURIComponent(secret);
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
