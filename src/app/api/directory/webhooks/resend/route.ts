import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Contact, Outreach, db } from "@/lib/nstp-directory";
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
    const event = JSON.parse(raw) as { type?: string; data?: { email_id?: string } };
    if (!["email.bounced", "email.complained", "email.suppressed"].includes(event.type || "")) {
      return NextResponse.json({ ok: true });
    }
    const providerId = event.data?.email_id;
    if (!providerId) return NextResponse.json({ ok: true });
    const messages = await db<Outreach[]>("nstp_outreach", "GET", { provider_id: "eq." + providerId, select: "*", limit: "1" });
    if (!messages.length) return NextResponse.json({ ok: true });
    const contacts = await db<Contact[]>("nstp_business_contacts", "GET", { id: "eq." + messages[0].contact_id, select: "*", limit: "1" });
    if (!contacts.length) return NextResponse.json({ ok: true });
    const email = contacts[0].email;
    const status = event.type === "email.bounced" ? "bounced" : "unsubscribed";
    const all = await db<Contact[]>("nstp_business_contacts", "GET", { email: "eq." + email, select: "id,review_status" });
    for (const item of all) {
      if (item.review_status !== "unsubscribed") await db("nstp_business_contacts", "PATCH", { id: "eq." + item.id }, { review_status: status, claim_eligible: false });
      await db("nstp_outreach", "PATCH", { contact_id: "eq." + item.id, status: "in.(queued,failed)" }, { status: "cancelled" });
    }
    await db("nstp_outreach", "PATCH", { id: "eq." + messages[0].id }, { status: "failed", last_error: event.type });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to process webhook." }, { status: 503 }); }
}
