import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Contact, Outreach, db, emailAddress } from "@/lib/nstp-directory";
import { suppressEmail } from "@/lib/nstp-workflows";
export const runtime = "nodejs";

function verified(req: NextRequest, body: string) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  const id = req.headers.get("svix-id") || "";
  const timestamp = req.headers.get("svix-timestamp") || "";
  const signatures = req.headers.get("svix-signature") || "";
  if (!secret.startsWith("whsec_") || !id || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.slice(6), "base64");
  if (key.length < 16) return false;
  const expected = createHmac("sha256", key).update(id + "." + timestamp + "." + body).digest();
  return signatures.split(" ").some(part => {
    if (!part.startsWith("v1,")) return false;
    const actual = Buffer.from(part.slice(3), "base64");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verified(req, raw)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  try {
    const event = JSON.parse(raw) as { type?: string; data?: { email_id?: string; to?: string[] } };
    const supported = ["email.sent","email.delivered","email.delivery_delayed",
      "email.bounced","email.complained","email.suppressed","email.failed"];
    if (!supported.includes(event.type || "")) return NextResponse.json({ ok: true });
    const providerId = event.data?.email_id;
    const jobs = providerId
      ? await db<Outreach[]>("nstp_outreach", "GET",
        { provider_id: "eq." + providerId, select: "*", limit: "1" }) : [];
    const job = jobs[0];
    if (providerId) {
      const checks = await db<{ id: number; mail_test_status: string }[]>("nstp_automation_control", "GET", {
        id: "eq.1", mail_test_provider_id: "eq." + providerId,
        select: "id,mail_test_status", limit: "1"
      });
      if (checks[0] && ["testing","accepted"].includes(checks[0].mail_test_status)) {
        if (event.type === "email.delivered") {
          await db("nstp_automation_control", "PATCH",
            { id: "eq.1", mail_test_status: "in.(testing,accepted)" }, {
              mail_test_status: "delivered", mail_test_delivered_at: new Date().toISOString(),
              mail_test_error: null, updated_at: new Date().toISOString()
            });
        } else if (["email.bounced","email.complained","email.suppressed","email.failed"].includes(event.type || "")) {
          await db("nstp_automation_control", "PATCH",
            { id: "eq.1", mail_test_status: "in.(testing,accepted)" }, {
              mail_test_status: "failed", mail_test_error: "Resend event: " + event.type,
              updated_at: new Date().toISOString()
            });
        }
      }
    }
    const eventStatus: Record<string, string> = {
      "email.sent": "accepted", "email.delivered": "delivered",
      "email.delivery_delayed": "delayed", "email.bounced": "bounced",
      "email.complained": "complained", "email.suppressed": "suppressed",
      "email.failed": "failed"
    };
    if (job) {
      await db("nstp_outreach", "PATCH", { id: "eq." + job.id }, {
        delivery_status: eventStatus[event.type || ""] || "unknown",
        last_event_at: new Date().toISOString(),
        ...(["email.bounced","email.complained","email.suppressed","email.failed"].includes(event.type || "")
            ? { status: "failed", last_error: event.type } : {})
      });
    }
    if (["email.bounced","email.complained","email.suppressed"].includes(event.type || "")) {
      const emails = new Set<string>();
      if (job) {
        const contacts = await db<Contact[]>("nstp_business_contacts", "GET",
          { id: "eq." + job.contact_id, select: "email", limit: "1" });
        if (contacts.length) emails.add(contacts[0].email);
      }
      for (const rawEmail of event.data?.to || []) {
        const email = emailAddress(rawEmail);
        if (email) {
          const present = await db<Contact[]>("nstp_business_contacts", "GET",
            { email: "eq." + email, select: "id", limit: "1" });
          if (present.length) emails.add(email);
        }
      }
      const reason = event.type === "email.bounced" ? "bounce" :
        event.type === "email.complained" ? "complaint" : "provider";
      for (const email of emails) await suppressEmail(email, reason);
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to process webhook." }, { status: 503 }); }
}
