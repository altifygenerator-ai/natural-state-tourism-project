import { NextRequest, NextResponse } from "next/server";
import { unsubscribeContact } from "@/lib/nstp-unsubscribe";
export const runtime = "nodejs";
// RFC 8058: mail clients use POST, never GET, to prevent link scanners from unsubscribing people.
export async function POST(req: NextRequest) {
  try {
    const { status, message } = await unsubscribeContact(
      req.nextUrl.searchParams.get("c") || "", req.nextUrl.searchParams.get("s") || ""
    );
    return new NextResponse(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch {
    return new NextResponse("Unable to process unsubscribe request.", { status: 503 });
  }
}
