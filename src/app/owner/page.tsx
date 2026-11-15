"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Business = { id: string; name: string; city: string; description: string;
  phone: string | null; address: string | null; website: string | null; image_url: string | null; hours: string | null; };
type Stats = { profile_views: number; website_clicks: number; phone_clicks: number };
type History = Stats & { month: string };
type SiteHistory = { month: string; tracked_pageviews: number };
type OwnerData = { business: Business; email: string; monthlyReportOptIn: boolean;
  metrics: Stats; history: History[]; siteHistory: SiteHistory[] };
const editable = ["description", "phone", "address", "website", "image_url", "hours"] as const;
function labelMonth(month: string) {
  const date = new Date(month + "T12:00:00Z");
  return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
export default function OwnerPage() {
  const [data, setData] = useState<OwnerData | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPreference, setUpdatingPreference] = useState(false);
  useEffect(() => {
    fetch("/api/directory/owner", { cache: "no-store" }).then(r => r.json()).then(payload => {
      if (payload.business) {
        setData(payload as OwnerData);
        setValues(Object.fromEntries(editable.map(k => [k, payload.business[k] || ""])));
      } else setMessage(payload.error || "Please verify your email to continue.");
    }).catch(() => setMessage("Unable to load your listing.")).finally(() => setLoading(false));
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setMessage("");
    try {
      const r = await fetch("/api/directory/owner", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values) });
      const result = await r.json();
      setMessage(result.message || result.error || "Unable to save.");
    } catch { setMessage("Network error. Please try again."); }
    finally { setSaving(false); }
  }
  async function setReports(enabled: boolean) {
    setUpdatingPreference(true); setPreferenceMessage("");
    try {
      const r = await fetch("/api/directory/owner", { method: "PATCH",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monthlyReportOptIn: enabled }) });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Could not save preference");
      setData(previous => previous ? { ...previous, monthlyReportOptIn: enabled } : previous);
      setPreferenceMessage(result.message);
    } catch (err) { setPreferenceMessage(err instanceof Error ? err.message : "Unable to save."); }
    finally { setUpdatingPreference(false); }
  }
  const metrics = data?.metrics;
  const reported = (metrics?.profile_views || 0) + (metrics?.website_clicks || 0) + (metrics?.phone_clicks || 0);
  return <main className="min-h-screen bg-[#faf8f2] pb-24 pt-36"><div className="mx-auto max-w-3xl px-5">
    <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#9c7430]">Business owner portal</p>
    <h1 className="font-heading text-4xl font-bold text-[#183527] md:text-5xl">Your business listing</h1>
    {loading ? <p className="mt-8">Loading listing…</p> : !data ? <div className="mt-8 rounded-xl bg-white p-8">
      <p>{message}</p><Link className="mt-4 inline-block underline" href="/businesses">Find your business</Link>
    </div> : <>
      <p className="mt-4 text-[#566356]">Verified as {data.email}. Claiming and updating your basic listing is free.</p>
      <section className="mt-8 rounded-xl border border-[#e0e6db] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-heading text-2xl font-bold text-[#183527]">Your visitor reach</h2>
            <p className="mt-1 text-sm text-[#627062]">Recorded interactions in the last 30 days</p></div>
          <Link className="text-sm font-semibold text-[#836224] underline" href={"/businesses/" + data.business.id}>View public profile</Link>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["Profile views",metrics?.profile_views ?? 0],
            ["Website clicks",metrics?.website_clicks ?? 0],
            ["Phone clicks",metrics?.phone_clicks ?? 0]
          ].map(([name,num])=><div key={name} className="rounded-lg bg-[#f5f6ef] p-4 text-center">
            <p className="font-heading text-3xl font-bold text-[#183527]">{num}</p>
            <p className="mt-1 text-xs text-[#637067]">{name}</p></div>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-[#677266]">{reported===0
          ? "No recorded interactions yet. Tracking starts when the new business links and city-guide integration are live; previous traffic cannot be reconstructed."
          : "Numbers are deduplicated observed actions, not guaranteed unique visitors, inquiries, reservations, or sales."}</p>
        {data.history?.length>0 && <div className="mt-5 border-t pt-4">
          <h3 className="text-sm font-bold text-[#183527]">Completed months</h3>
          <div className="mt-2 space-y-2">{data.history.slice(0, 4).map(m=><div key={m.month}
            className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#546252]">
            <span>{labelMonth(m.month)}</span><span>{m.profile_views} profile views · {m.website_clicks} website clicks</span>
          </div>)}</div>
        </div>}
        {data.siteHistory?.some(x => x.tracked_pageviews > 0) &&
          <div className="mt-5 rounded-lg bg-[#f5f6ef] p-4 text-sm text-[#596a5b]">
            <p className="font-semibold text-[#183527]">Your city's guide reach</p>
            {data.siteHistory.filter(x => x.tracked_pageviews > 0).slice(0, 2).map(x =>
              <p className="mt-1" key={x.month}>{labelMonth(x.month)}:{" "}
                {x.tracked_pageviews.toLocaleString()} tracked pageviews across the {data.business.city} guide.</p>)}
            <p className="mt-2 text-xs">Guide-wide pageviews are not views of your business listing or guaranteed customer referrals.</p>
          </div>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
          <div><p className="text-sm font-semibold text-[#183527]">Email my monthly report</p>
            <p className="mt-1 text-xs text-[#667465]">Optional. Only sent for months with recorded activity.</p></div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={data.monthlyReportOptIn} disabled={updatingPreference}
              onChange={e => setReports(e.target.checked)} className="h-4 w-4 accent-[#183527]" />
            {data.monthlyReportOptIn?"On":"Off"}
          </label>
        </div>
        {preferenceMessage && <p role="status" className="mt-3 text-xs text-[#556c57]">{preferenceMessage}</p>}
      </section>
      <form onSubmit={save} className="mt-8 space-y-5 rounded-xl border bg-white p-7 shadow-sm">
        <h2 className="font-heading text-2xl font-bold text-[#183527]">Keep your details current</h2>
        <p className="text-sm text-[#6c766e]">{data.business.name} · {data.business.city}, Arkansas</p>
        {editable.map(k=><label key={k} className="block text-sm font-semibold capitalize text-[#183527]">{k.replace("_"," ")}
          {k==="description"||k==="hours"?<textarea rows={k==="description"?5:3}
            maxLength={k==="description"?1800:600} className="mt-2 block w-full rounded-md border border-[#cdd5cc] p-3"
            value={values[k]||""} onChange={e=>setValues({...values,[k]:e.target.value})}/>:
            <input type={k==="website"||k==="image_url"?"url":"text"}
              className="mt-2 block w-full rounded-md border border-[#cdd5cc] p-3"
              value={values[k]||""} onChange={e=>setValues({...values,[k]:e.target.value})}/>}
        </label>)}
        <button disabled={saving} className="rounded-full bg-[#183527] px-7 py-3 font-semibold text-white disabled:opacity-60">
          {saving?"Submitting…":"Submit listing updates"}
        </button>
        {message && <p role="status" className="rounded-lg bg-[#edf3eb] p-4 text-sm">{message}</p>}
        <p className="text-xs text-[#6b796f]">Changes are reviewed before publication. Some city guides are still being connected to the shared directory.</p>
      </form>
      <section className="mt-8 rounded-xl border border-[#e3dfd3] bg-[#f7f3e9] p-6">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-[#8e6b2c]">Optional visibility</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-[#183527]">Want to reach more visitors?</h2>
        <p className="mt-3 text-sm leading-6 text-[#5c665d]">
          Your basic listing stays free. If you&apos;d like extra exposure, featured placements start at
          <strong> $20/month</strong>, and a dedicated business spotlight is <strong>$100 one time</strong>.
          Neither is required to keep your listing claimed.
        </p>
        <Link href="/advertising" className="mt-4 inline-block text-sm font-bold text-[#183527] underline">See advertising options</Link>
      </section>
      <p className="mt-6 text-sm text-[#637064]">Need to change the business name, transfer ownership, or remove a listing? <Link href="/contact" className="underline">Contact our team</Link>.</p>
    </>}
  </div></main>;
}
