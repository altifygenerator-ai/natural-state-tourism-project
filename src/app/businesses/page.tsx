import type { Metadata } from "next";
import Link from "next/link";
import { Business, configured, db } from "@/lib/nstp-directory";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Arkansas Business Directory | Claim Your Listing", description: "Find local businesses in the Natural State Tourism Project guides, and claim or correct your listing for free." };
const cities = ["Hot Springs", "Glenwood", "Mount Ida", "Murfreesboro", "Amity"];
export default async function BusinessesPage({ searchParams }: { searchParams: Promise<{ city?: string; claim?: string }> }) {
  const { city, claim } = await searchParams;
  let businesses: Business[] = [];
  let error = !configured();
  if (!error) {
    try {
      const params: Record<string, string> = { status: "eq.active", select: "*", order: "city.asc,name.asc", limit: "600" };
      if (city && cities.includes(city)) params.city = "eq." + city;
      businesses = await db<Business[]>("nstp_businesses", "GET", params);
    } catch { error = true; }
  }
  return <main className="min-h-screen bg-[#faf8f2] pb-24 pt-36">
    <div className="mx-auto max-w-6xl px-5">
      <div className="mb-12 max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#9c7430]">Natural State Tourism Project</p>
        <h1 className="font-heading text-5xl font-bold text-[#183527] md:text-6xl">Arkansas business directory</h1>
        <p className="mt-5 text-lg leading-8 text-[#4e5e51]">A growing collection of local businesses featured across our independent Arkansas travel guides. Business owners can review and claim their basic listing at no cost.</p>
      </div>
      {claim && <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">That verification link is invalid or expired. Please request a new claim link.</p>}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link className={"rounded-full px-5 py-2 text-sm font-semibold " + (!city ? "bg-[#183527] text-white" : "border border-[#cdd4c9] text-[#183527]")} href="/businesses">All areas</Link>
        {cities.map(c => <Link key={c} href={"/businesses?city=" + encodeURIComponent(c)} className={"rounded-full px-5 py-2 text-sm font-semibold " + (city === c ? "bg-[#183527] text-white" : "border border-[#cdd4c9] text-[#183527]")}>{c}</Link>)}
      </div>
      {error ? <div className="rounded-xl border bg-white p-8 text-[#586356]">The business directory is being prepared. You can still <Link href="/contact" className="underline">contact our team</Link> about a listing.</div> :
       businesses.length === 0 ? <p className="rounded-xl border bg-white p-8">There are no listings for this selection yet.</p> :
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {businesses.map(b => <article key={b.id} className="flex flex-col rounded-xl border border-[#e7e6df] bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#9c7430]">{b.city} · {b.category}</p>
          <h2 className="font-heading text-2xl font-bold text-[#183527]">{b.name}</h2>
          <p className="mt-3 line-clamp-3 grow text-sm leading-6 text-[#5b665c]">{b.description || "Find this local stop in our Arkansas area guides."}</p>
          {b.address && <p className="mt-4 text-sm text-[#667064]">{b.address}</p>}
          <div className="mt-6 flex flex-wrap gap-4 border-t pt-4 text-sm font-bold">
            {b.website && <a className="text-[#183527] underline" href={b.website} target="_blank" rel="noopener noreferrer">Visit website</a>}
            <Link className="text-[#906c2c] underline" href={"/claim/" + b.id}>Claim or correct listing</Link>
          </div>
        </article>)}
      </div>}
      <div className="mt-14 rounded-xl bg-[#183527] p-8 text-white md:p-10">
        <h2 className="font-heading text-3xl font-bold">Is your business missing?</h2>
        <p className="mt-3 max-w-2xl text-white/80">Reach out to suggest a new business or correct an existing listing. Free listings are separate from paid featured placements.</p>
        <Link href="/contact" className="mt-6 inline-block rounded-full bg-[#d4a753] px-6 py-3 text-sm font-bold text-[#183527]">Contact the team</Link>
      </div>
    </div>
  </main>;
}
