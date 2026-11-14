import { NextRequest, NextResponse } from "next/server";
import { Business, UUID, cleanChanges, db, ownerFromRequest } from "@/lib/nstp-directory";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const session = ownerFromRequest(req);
  if (!session) return NextResponse.json({ error: "Please verify your business email again." }, { status: 401 });
  try {
    const businesses = await db<Business[]>("nstp_businesses", "GET", { id: "eq." + session.b, select: "*", limit: "1" });
    return NextResponse.json({ business: businesses[0] || null, email: session.e });
  } catch { return NextResponse.json({ error: "Unable to load your listing." }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  const session = ownerFromRequest(req);
  if (!session || !UUID.test(session.b)) return NextResponse.json({ error: "Session expired. Verify your email again." }, { status: 401 });
  try {
    const payload = cleanChanges(await req.json());
    if (!Object.keys(payload).length) return NextResponse.json({ error: "No valid changes supplied." }, { status: 400 });
    const existing = await db<{ id: string }[]>("nstp_business_changes", "GET",
      { business_id: "eq." + session.b, status: "eq.pending", select: "id", limit: "5" });
    if (existing.length >= 5) return NextResponse.json({ error: "Please wait for your previous submissions to be reviewed." }, { status: 429 });
    await db("nstp_business_changes", "POST", {}, [{ business_id: session.b, submitted_by: session.e, payload, status: "pending" }]);
    return NextResponse.json({ message: "Your edits are submitted for review. They will appear after approval." });
  } catch { return NextResponse.json({ error: "Unable to submit your changes." }, { status: 503 }); }
}
