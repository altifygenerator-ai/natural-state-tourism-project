import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import TrafficBeacon from "@/components/directory/TrafficBeacon";
import BusinessPhoneLink from "@/components/directory/BusinessPhoneLink";
import { Business, UUID, db } from "@/lib/nstp-directory";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Local Arkansas Business | Natural State Tourism Project" };

export default async function BusinessProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  let business: Business | null = null;
  try {
    business = (await db<Business[]>("nstp_businesses", "GET",
      { id: "eq." + id, status: "eq.active", select: "*", limit: "1" }))[0] || null;
  } catch { notFound(); }
  if (!business) notFound();
  return <main className="min-h-screen bg-[#faf8f2] pb-24 pt-36">
    <TrafficBeacon businessId={business.id} />
    <div className="mx-auto max-w-3xl px-5">
      <Link href={"/businesses?city=" + encodeURIComponent(business.city)}
        className="text-sm font-semibold text-[#836224] underline">Back to {business.city} businesses</Link>
      <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-[#9c7430]">
        {business.city}, Arkansas · {business.category}
      </p>
      <h1 className="mt-3 font-heading text-4xl font-bold text-[#183527] md:text-5xl">{business.name}</h1>
      {business.description && <p className="mt-7 whitespace-pre-line text-lg leading-8 text-[#506052]">{business.description}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        {business.website && <a href={"/api/directory/out/" + business.id + "?placement=business-profile"}
          target="_blank" rel="noopener noreferrer"
          className="rounded-full bg-[#183527] px-6 py-3 text-sm font-bold text-white">Visit business website</a>}
        {business.phone && <BusinessPhoneLink businessId={business.id} phone={business.phone}/>}
      </div>
      <div className="mt-8 rounded-xl border border-[#e4e6de] bg-white p-6">
        <h2 className="font-heading text-xl font-bold text-[#183527]">Visitor information</h2>
        {business.address && <p className="mt-4 text-sm leading-6"><strong>Address:</strong> {business.address}</p>}
        {business.hours && <p className="mt-3 whitespace-pre-wrap text-sm leading-6"><strong>Hours:</strong> {business.hours}</p>}
        {!business.address && !business.hours && <p className="mt-3 text-sm text-[#657264]">
          Confirm hours and directions with the business before visiting.</p>}
      </div>
      <div className="mt-8 border-t pt-6 text-sm text-[#647064]">
        <p>Are you the owner? <Link className="font-semibold text-[#836224] underline"
          href={"/claim/" + business.id}>Claim or correct this listing for free.</Link></p>
        <p className="mt-2">Optional <Link href="/advertising" className="underline">featured placements and spotlight pages</Link>
          {" "}are available separately. Your basic listing stays free.</p>
      </div>
    </div>
  </main>;
}
