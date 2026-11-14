import { NextRequest, NextResponse } from "next/server";
import { Contact, UUID, db, validUnsubscribe } from "@/lib/nstp-directory";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.contactId || ""), signature = String(body.signature || "");
    if (!UUID.test(id) || !validUnsubscribe(id, signature)) return NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 });
    const contacts = await db<Contact[]>("nstp_business_contacts", "GET", { id: "eq." + id, select: "*", limit: "1" });
    if (!contacts.length) return NextResponse.json({ error: "Unknown contact." }, { status: 404 });
    // Suppress the address across every city listing, not just the contacted business.
    await db("nstp_business_contacts", "PATCH", { email: "eq." + contacts[0].email }, { review_status: "unsubscribed", claim_eligible: false });
    const suppressed = await db<Contact[]>("nstp_business_contacts", "GET", { email: "eq." + contacts[0].email, select: "id" });
    for (const contact of suppressed) {
      await db("nstp_outreach", "PATCH", { contact_id: "eq." + contact.id, status: "in.(queued,failed)" }, { status: "cancelled" });
    }
    return NextResponse.json({ message: "You have been unsubscribed from future directory outreach." });
  } catch { return NextResponse.json({ error: "Unable to process your request." }, { status: 503 }); }
}
