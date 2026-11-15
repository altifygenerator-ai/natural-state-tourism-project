import { NextRequest, NextResponse } from "next/server";
import { Business, Contact, adminAllowed, claimHtml, mailFrom, mailReplyTo, outreachHtml, ORIGIN } from "@/lib/nstp-directory";
export const runtime = "nodejs";

// Sample-only preview. No customer address, sending API key or send action is exposed.
export async function POST(req: NextRequest) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const business = {
    id: "17f9cd1e-2db5-4f12-8aa3-443cd5e40123",
    name: "Example Arkansas Business",
    city: "Glenwood"
  } as Business;
  const contact = { id: "27f9cd1e-2db5-4f12-8aa3-443cd5e40123" } as Contact;
  const postal = process.env.NSTP_POSTAL_ADDRESS || "[Your physical mailing address will appear here]";
  const verificationLink = ORIGIN + "/verify-business?id=sample-only&token=preview-do-not-click";
  try {
    return NextResponse.json({
      from: mailFrom(),
      replyTo: mailReplyTo(),
      previewOnly: true,
      invitation: {
        subject: "Your free listing in the Glenwood Arkansas guide",
        html: outreachHtml(business, contact, { previewPostalAddress: postal })
      },
      verification: {
        subject: "Verify your listing: Example Arkansas Business",
        html: claimHtml(business, verificationLink)
      }
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Sender configuration must use naturalstatetourismproject.org." }, { status: 503 });
  }
}
