import { Contact, UUID, db, validUnsubscribe } from "@/lib/nstp-directory";
import { suppressEmail } from "@/lib/nstp-workflows";

export async function unsubscribeContact(id: string, signature: string) {
  if (!UUID.test(id) || !validUnsubscribe(id, signature)) {
    return { status: 400, message: "Invalid unsubscribe link." };
  }
  const rows = await db<Contact[]>("nstp_business_contacts", "GET",
    { id: "eq." + id, select: "email", limit: "1" });
  if (!rows.length) return { status: 404, message: "Unknown contact." };
  await suppressEmail(rows[0].email, "unsubscribe");
  return { status: 200, message: "You have been unsubscribed from future directory outreach." };
}
