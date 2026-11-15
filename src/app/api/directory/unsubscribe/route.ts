import { NextRequest, NextResponse } from "next/server";
import { unsubscribeContact } from "@/lib/nstp-unsubscribe";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { status, message } = await unsubscribeContact(String(body.contactId || ""), String(body.signature || ""));
    return NextResponse.json(status === 200 ? { message } : { error: message }, { status });
  } catch {
    return NextResponse.json({ error: "Unable to process your unsubscribe request." }, { status: 503 });
  }
}
