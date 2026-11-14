import { Business, Contact, Outreach, db, outreachHtml, researchEmails, sendMail } from "@/lib/nstp-directory";

export async function researchBusiness(id: string) {
  const rows = await db<Business[]>("nstp_businesses", "GET", { id: "eq." + id, select: "*", limit: "1" });
  const b = rows[0];
  if (!b?.website) return { found: 0, added: 0, message: "No official website recorded." };
  const discovered = await researchEmails(b.website);
  const seen = await db<Contact[]>("nstp_business_contacts", "GET", { business_id: "eq." + id, select: "email" });
  const existing = new Set(seen.map(c => c.email));
  const newContacts = discovered.filter(c => !existing.has(c.email));
  if (newContacts.length) await db("nstp_business_contacts", "POST", { on_conflict: "business_id,email" },
    newContacts.map(c => ({ ...c, business_id: id, review_status: "candidate", claim_eligible: false })), "resolution=ignore-duplicates,return=minimal");
  await db("nstp_businesses", "PATCH", { id: "eq." + id }, { last_researched_at: new Date().toISOString() });
  return { found: discovered.length, added: newContacts.length, message: "New addresses are awaiting review. Nothing was sent." };
}
export async function sendClaimInvitations(limit = 5) {
  if (process.env.NSTP_OUTREACH_ENABLED !== "true") throw new Error("Outreach is disabled.");
  if (!process.env.NSTP_POSTAL_ADDRESS || !process.env.NSTP_MAIL_FROM || !process.env.RESEND_API_KEY) throw new Error("Sender address and mail provider configuration are required.");
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const sent = await db<{ id: string }[]>("nstp_outreach", "GET", { status: "eq.sent", sent_at: "gte." + since.toISOString(), select: "id", limit: "15" });
  const available = Math.min(Math.max(0, 15 - sent.length), Math.max(0, Math.min(limit, 5)));
  if (!available) return { sent: 0, failed: 0, message: "Daily limit reached." };
  const queued = await db<Outreach[]>("nstp_outreach", "GET", { status: "eq.queued", select: "*", order: "created_at.asc", limit: String(available) });
  let success = 0, failed = 0;
  for (const job of queued) {
    const claimed = await db<Outreach[]>("nstp_outreach", "PATCH", { id: "eq." + job.id, status: "eq.queued" }, { status: "sending", attempts: job.attempts + 1 });
    if (!claimed.length) continue;
    try {
      const contacts = await db<Contact[]>("nstp_business_contacts", "GET", { id: "eq." + job.contact_id, select: "*", limit: "1" });
      const contact = contacts[0];
      if (!contact || contact.review_status !== "approved" || !contact.claim_eligible) {
        await db("nstp_outreach", "PATCH", { id: "eq." + job.id }, { status: "cancelled" });
        continue;
      }
      const all = await db<Contact[]>("nstp_business_contacts", "GET", { email: "eq." + contact.email, review_status: "eq.unsubscribed", select: "id", limit: "1" });
      if (all.length) {
        await db("nstp_outreach", "PATCH", { id: "eq." + job.id }, { status: "cancelled" });
        continue;
      }
      const businesses = await db<Business[]>("nstp_businesses", "GET", { id: "eq." + contact.business_id, select: "*", limit: "1" });
      const business = businesses[0];
      if (!business || business.status !== "active") {
        await db("nstp_outreach", "PATCH", { id: "eq." + job.id }, { status: "cancelled" });
        continue;
      }
      // Only one invitation per address across the network for this campaign.
      const other = await db<Contact[]>("nstp_business_contacts", "GET", { email: "eq." + contact.email, select: "id" });
      let alreadyInvited = false;
      for (const duplicate of other) {
        if (duplicate.id === contact.id) continue;
        const sentOther = await db<Outreach[]>("nstp_outreach", "GET", { contact_id: "eq." + duplicate.id, campaign: "eq.free_claim_v1", status: "eq.sent", select: "id", limit: "1" });
        if (sentOther.length) { alreadyInvited = true; break; }
      }
      if (alreadyInvited) {
        await db("nstp_outreach", "PATCH", { id: "eq." + job.id }, { status: "cancelled" });
        continue;
      }
      const result = await sendMail(contact.email, "Your free listing in the " + business.city + " Arkansas guide", outreachHtml(business, contact));
      await db("nstp_outreach", "PATCH", { id: "eq." + job.id }, { status: "sent", provider_id: result.id || null, sent_at: new Date().toISOString(), last_error: null });
      success++;
    } catch (err) {
      failed++;
      await db("nstp_outreach", "PATCH", { id: "eq." + job.id },
        { status: "failed", last_error: err instanceof Error ? err.message.slice(0, 200) : "Unknown delivery error" });
    }
  }
  return { sent: success, failed, message: "Sent only previously approved contacts." };
}
