import type { Metadata } from "next";
import Link from "next/link";
import { UUID } from "@/lib/nstp-directory";
export const metadata: Metadata = { title: "Verify Business Ownership", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function VerifyBusinessPage({ searchParams }: { searchParams: Promise<{ id?: string; token?: string }> }) {
  const { id = "", token = "" } = await searchParams;
  const valid = UUID.test(id) && token.length >= 40 && token.length <= 200;
  return <main className="min-h-screen bg-[#faf8f2] pb-24 pt-36">
    <meta name="referrer" content="no-referrer" />
    <div className="mx-auto max-w-xl px-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#9c7430]">Free business claiming</p>
      <h1 className="font-heading text-5xl font-bold text-[#183527]">Confirm your business email</h1>
      <p className="mt-5 leading-8 text-[#536453]">Confirm that you requested access to this listing. The verification link expires in 24 hours and can only be used once.</p>
      {valid ? <form method="post" action="/api/directory/verify" className="mt-8 rounded-xl border bg-white p-8">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="rounded-full bg-[#183527] px-7 py-3 font-bold text-white">
          Verify email and open my listing
        </button>
      </form> : <p className="mt-7 rounded-lg border bg-white p-6">This link is incomplete. Please request a new one.</p>}
      <Link className="mt-6 inline-block text-sm font-semibold text-[#8e6d2a] underline" href="/businesses">Back to business directory</Link>
    </div>
  </main>;
}
