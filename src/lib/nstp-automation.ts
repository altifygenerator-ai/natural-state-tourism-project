import { randomUUID } from "node:crypto";
import { Business, Contact, db, emailAddress, mailFrom, outreachHtml, sendMail } from "@/lib/nstp-directory";

export type AutomationControl = {
  id: number;
  research_enabled: boolean;
  outreach_requested: boolean;
  mail_test_status: "pending" | "testing" | "accepted" | "delivered" | "failed";
  mail_test_provider_id: string | null;
  mail_test_recipient: string | null;
  mail_test_started_at: string | null;
  mail_test_delivered_at: string | null;
  mail_test_error: string | null;
  last_cron_at: string | null;
  last_cron_result: Record<string, unknown> | null;
};

export async function getAutomationControl(): Promise<AutomationControl> {
  const rows = await db<AutomationControl[]>("nstp_automation_control", "GET", {
    id: "eq.1", select: "*", limit: "1"
  });
  if (!rows[0]) throw new Error("Automation control is not initialized");
  return rows[0];
}

export function mailStartupReadiness(): string | null {
  const recipient = emailAddress(process.env.NSTP_TEST_EMAIL);
  if (!recipient || recipient !== process.env.NSTP_TEST_EMAIL?.trim().toLowerCase())
    return "NSTP_TEST_EMAIL is missing or invalid";
  if (!process.env.RESEND_API_KEY) return "RESEND_API_KEY is missing";
  if (!process.env.RESEND_WEBHOOK_SECRET?.startsWith("whsec_"))
    return "RESEND_WEBHOOK_SECRET is missing or invalid";
  if (!process.env.NSTP_TOKEN_SECRET || process.env.NSTP_TOKEN_SECRET.length < 32)
    return "NSTP_TOKEN_SECRET must be at least 32 characters";
  if (!process.env.NSTP_POSTAL_ADDRESS || process.env.NSTP_POSTAL_ADDRESS.trim().length < 10 ||
      /placeholder|your address|\[.*\]/i.test(process.env.NSTP_POSTAL_ADDRESS))
    return "NSTP_POSTAL_ADDRESS requires the actual business mailing address";
  try { mailFrom(); }
  catch { return "NSTP_MAIL_FROM must use naturalstatetourismproject.org"; }
  return null;
}

// Sends exactly one controlled email to the configured project inbox. A
// delivery event from the signed Resend webhook is needed before any cold mail.
export async function attemptFirstMailTest(): Promise<{ status: string; message: string }> {
  const control = await getAutomationControl();
  if (!control.outreach_requested) return { status: control.mail_test_status, message: "Automated outreach is paused" };
  if (control.mail_test_status !== "pending") return {
    status: control.mail_test_status, message: "Existing verification state retained; no duplicate test sent"
  };
  const readiness = mailStartupReadiness();
  if (readiness) return { status: "pending", message: readiness };
  const at = new Date().toISOString();
  const claimed = await db<AutomationControl[]>("nstp_automation_control", "PATCH",
    { id: "eq.1", mail_test_status: "eq.pending" }, {
      mail_test_status: "testing", mail_test_started_at: at, mail_test_error: null, updated_at: at
    });
  if (!claimed.length) return { status: "testing", message: "Another process owns the test" };
  try {
    const businesses = await db<Business[]>("nstp_businesses", "GET", {
      status: "eq.active", select: "*", order: "name.asc", limit: "1"
    });
    if (!businesses.length) throw new Error("Directory does not contain an active business");
    const recipient = process.env.NSTP_TEST_EMAIL!.trim().toLowerCase();
    const contact = { id: randomUUID() } as Contact;
    const html = '<p style="padding:12px;background:#fff3d6"><strong>CONTROLLED SENDER TEST.</strong> ' +
      'This invitation is only a sample for the Natural State team. Do not use the example claim or unsubscribe links.</p>' +
      outreachHtml(businesses[0], contact);
    const result = await sendMail(recipient, "[TEST] Natural State business claim invitation", html, {
      idempotencyKey: "nstp-production-mail-test-v1"
    });
    if (!result.id) throw new Error("Sender did not return an email identifier");
    await db("nstp_automation_control", "PATCH",
      { id: "eq.1", mail_test_status: "eq.testing" }, {
        mail_test_status: "accepted", mail_test_provider_id: result.id,
        mail_test_recipient: recipient, updated_at: new Date().toISOString()
      });
    return { status: "accepted", message: "Controlled email accepted; awaiting signed delivery webhook" };
  } catch (error) {
    // Unknown provider outcomes are intentionally not retried automatically.
    const message = error instanceof Error ? error.message.slice(0, 160) : "Unknown test delivery error";
    await db("nstp_automation_control", "PATCH", { id: "eq.1", mail_test_status: "eq.testing" }, {
      mail_test_status: "failed", mail_test_error: message, updated_at: new Date().toISOString()
    });
    return { status: "failed", message };
  }
}
