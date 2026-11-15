import { getAutomationControl, mailStartupReadiness } from "@/lib/nstp-automation";
import { resolveMx } from "node:dns/promises";
import { Business, Contact, Outreach, UUID, autoApprovedRoleContact, db, outreachHtml, researchEmails, rpc, sendMail, unsubscribeSignature, ORIGIN } from "@/lib/nstp-directory";

async function suppressed(email: string) {
  const rows = await db<{ email: string }[]>("nstp_suppression", "GET", { email: "eq." + email, select: "email", limit: "1" });
  return rows.length > 0;
}

export async function suppressEmail(email: string, reason: "unsubscribe" | "complaint" | "bounce" | "manual" | "provider") {
  await db("nstp_suppression", "POST", { on_conflict: "email" }, [{ email, reason }], "resolution=ignore-duplicates,return=minimal");
  await db("nstp_business_contacts", "PATCH", { email: "eq." + email }, {
    review_status: reason === "bounce" ? "bounced" : "unsubscribed", claim_eligible: false
  });
  const contacts = await db<Contact[]>("nstp_business_contacts", "GET", { email: "eq." + email, select: "id" });
  for (const contact of contacts) {
    await db("nstp_outreach", "PATCH", { contact_id: "eq." + contact.id, status: "in.(queued,failed)" },
      { status: "cancelled", last_error: "Address suppressed: " + reason });
  }
}

export async function researchBusiness(id: string) {
  if (!UUID.test(id)) throw new Error("Invalid business ID");
  const rows = await db<Business[]>("nstp_businesses", "GET", { id: "eq." + id, select: "*", limit: "1" });
  const b = rows[0];
  if (!b?.website || b.status !== "active") return { found: 0, added: 0, queued: 0, message: "No active listing with an official website." };
  const discovered = await researchEmails(b.website);
  const existing = await db<Contact[]>("nstp_business_contacts", "GET", { business_id: "eq." + id, select: "email" });
  const seen = new Set(existing.map(c => c.email));
  let added = 0, queued = 0;
  const mxCache = new Map<string, boolean>();
  for (const candidate of discovered) {
    if (seen.has(candidate.email) || await suppressed(candidate.email)) continue;
    let auto = false;
    if (process.env.NSTP_AUTO_APPROVE_ROLE_CONTACTS !== "false" &&
        autoApprovedRoleContact(b.website, candidate.email, candidate.confidence)) {
      const domain = candidate.email.split("@")[1];
      if (!mxCache.has(domain)) {
        try { mxCache.set(domain, (await resolveMx(domain)).length > 0); }
        catch { mxCache.set(domain, false); }
      }
      auto = mxCache.get(domain) === true;
    }
    const contacts = await db<Contact[]>("nstp_business_contacts", "POST", { on_conflict: "business_id,email" },
      [{ ...candidate, business_id: id, review_status: auto ? "approved" : "candidate",
        claim_eligible: auto, approved_at: auto ? new Date().toISOString() : null }],
      "resolution=ignore-duplicates,return=representation");
    if (contacts.length) {
      added++;
      if (auto) {
        await db("nstp_outreach", "POST", { on_conflict: "contact_id,campaign" },
          [{ contact_id: contacts[0].id, campaign: "free_claim_v1", status: "queued" }],
          "resolution=ignore-duplicates,return=minimal");
        queued++;
      }
    }
  }
  await db("nstp_businesses", "PATCH", { id: "eq." + id }, { last_researched_at: new Date().toISOString() });
  return { found: discovered.length, added, queued,
    message: "New contacts researched; eligible role-based inboxes queued, others require review. No email sent by research." };
}

export async function sendClaimInvitations(limit = 5) {
  const control = await getAutomationControl();
  if (!control.outreach_requested || control.mail_test_status !== "delivered")
    throw new Error("Outreach requires an enabled campaign and confirmed test email delivery");
  const readiness = mailStartupReadiness();
  if (readiness) throw new Error("Email sender not ready: " + readiness);
  // This RPC owns daily limits, email/campaign uniqueness, and row-level locking.
  // Its reservation is durable even if a provider timeout makes delivery ambiguous.
  const reserved = await rpc<Outreach[]>("nstp_reserve_outreach", { p_limit: Math.max(0, Math.min(Number(limit) || 0, 5)) });
  let sent = 0, failed = 0, cancelled = 0;
  for (const job of reserved) {
    try {
      const contact = (await db<Contact[]>("nstp_business_contacts", "GET",
        { id: "eq." + job.contact_id, select: "*", limit: "1" }))[0];
      if (!contact || contact.review_status !== "approved" || !contact.claim_eligible || await suppressed(contact.email)) {
        await db("nstp_outreach", "PATCH", { id: "eq." + job.id },
          { status: "cancelled", last_error: "Contact no longer eligible" });
        cancelled++; continue;
      }
      const business = (await db<Business[]>("nstp_businesses", "GET",
        { id: "eq." + contact.business_id, select: "*", limit: "1" }))[0];
      if (!business || business.status !== "active" || business.claimed_at) {
        await db("nstp_outreach", "PATCH", { id: "eq." + job.id },
          { status: "cancelled", last_error: "Business no longer eligible" });
        cancelled++; continue;
      }
      const url = ORIGIN + "/api/directory/unsubscribe/one-click?c=" + contact.id +
        "&s=" + encodeURIComponent(unsubscribeSignature(contact.id));
      const result = await sendMail(contact.email,
        "Your free listing in the " + business.city + " Arkansas guide",
        outreachHtml(business, contact),
        { idempotencyKey: "nstp-free-claim-" + job.id, unsubscribeUrl: url });
      await db("nstp_outreach", "PATCH", { id: "eq." + job.id },
        { status: "sent", delivery_status: "accepted", provider_id: result.id || null,
          sent_at: new Date().toISOString(), last_error: null });
      sent++;
    } catch (error) {
      // Never blindly retry an ambiguous provider outcome; investigate before resending.
      failed++;
      await db("nstp_outreach", "PATCH", { id: "eq." + job.id },
        { status: "failed", delivery_status: "uncertain", last_error:
          error instanceof Error ? error.message.slice(0, 200) : "Provider outcome uncertain" });
    }
  }
  return { sent, failed, cancelled,
    message: "Reserved contacts processed with network-wide deduplication. Ambiguous failures require review." };
}
