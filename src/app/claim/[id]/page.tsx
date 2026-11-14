import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import ClaimForm from "@/components/directory/ClaimForm";
import { Business, UUID, db } from "@/lib/nstp-directory";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claim Your Free Business Listing", robots: { index: false, follow: false } };
export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  let business: Business | null = null;
  try { business = (await db<Business[]>("nstp_businesses", "GET", { id: "eq." + id, select: "*", limit: "1" }))[0] || null; } catch {}
  if (!business) notFound();
  return <main className="min-h-screen bg-[#faf8f2] pb-24 pt-36">
    <div className="mx-auto max-w-2xl px-5">
      <Link href="/businesses" className="text-sm font-semibold text-[#8f6a29] underline">Back to all businesses</Link>
      <p className="mb-3 mt-10 text-xs font-bold uppercase tracking-[.25em] text-[#9c7430]">Free owner verification</p>
      <h1 className="font-heading text-5xl font-bold text-[#183527]">Claim your listing</h1>
      <div className="mt-7 rounded-lg bg-[#edf1e8] p-6">
        <h2 className="font-heading text-2xl font-bold text-[#183527]">{business.name}</h2>
        <p className="mt-2 text-sm text-[#59645b]">{business.city}, Arkansas · {business.category}</p>
        {business.address && <p className="mt-2 text-sm text-[#59645b]">{business.address}</p>}
      </div>
      <ClaimForm businessId={business.id} />
      <p className="mt-6 text-sm text-[#6d766d]">Already verified? Use the link from your confirmation email to reopen your owner dashboard.</p>
    </div>
  </main>;
}
