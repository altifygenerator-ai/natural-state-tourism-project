"use client";
import { useState } from "react";
type Business = { id: string; name: string; city: string; category: string; website: string | null; claimed_at: string | null; };
type Contact = { id: string; business_id: string; email: string; confidence: string; review_status: string; source_url: string | null; };
type Claim = { id: string; business_id: string; email: string; status: string; created_at: string; };
type Change = { id: string; business_id: string; status: string; submitted_by: string; payload: Record<string, string>; };
type Outreach = { id: string; contact_id: string; status: string; delivery_status?: string; last_error?: string | null; };
type SiteMonth = { site: string; month: string; tracked_pageviews: number };
type MonthlyDelivery = { id: string; month: string; status: string };
type Settings = { senderIdentity?: string; dbConfigured: boolean; senderConfigured: boolean; postalConfigured: boolean; webhookConfigured: boolean; testRecipientConfigured: boolean; researchEnabled: boolean; outreachEnabled: boolean; roleContactAutoApprove: boolean; monthlyReportsEnabled: boolean; };
type Dataset = { businesses: Business[]; contacts: Contact[]; claims: Claim[]; changes: Change[]; outreach: Outreach[]; siteMonthly?: SiteMonth[]; monthlyDeliveries?: MonthlyDelivery[]; settings?: Settings; };
const empty: Dataset = { businesses: [], contacts: [], claims: [], changes: [], outreach: [] };
export default function ManageBusinesses() {
  const [secret, setSecret] = useState("");
  const [data, setData] = useState<Dataset>(empty);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ from: string; replyTo: string; invitation: { subject: string; html: string }; verification: { subject: string; html: string } } | null>(null);
  const [previewTab, setPreviewTab] = useState<"invitation" | "verification">("invitation");
  const [notice, setNotice] = useState("");
  const [city, setCity] = useState("All");
  const [search, setSearch] = useState("");
  const [reportMonth, setReportMonth] = useState(() => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7));
  async function load() {
    const response = await fetch("/api/directory/admin", { headers: { "x-nstp-admin-key": secret }, cache: "no-store" });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Unable to load dashboard");
    setData(json as Dataset); setLoggedIn(true);
  }
  async function action(kind: string, id?: string) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/directory/admin", { method: "POST",
        headers: { "Content-Type": "application/json", "x-nstp-admin-key": secret }, body: JSON.stringify({ action: kind, id, limit: 5 }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Action failed");
      setNotice(json.message || JSON.stringify(json));
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Request failed"); }
    finally { setBusy(false); }
  }
  async function previewEmails() {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/directory/admin/preview", {
        method: "POST", headers: { "x-nstp-admin-key": secret }, cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to preview mail");
      setEmailPreview(data); setPreviewTab("invitation");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Preview failed"); }
    finally { setBusy(false); }
  }
  async function exportReport(kind: "site" | "business") {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/directory/admin/report?month=" + reportMonth + "&kind=" + kind,
        { headers: { "x-nstp-admin-key": secret }, cache: "no-store" });
      if (!response.ok) throw new Error("Unable to export data for " + reportMonth);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "nstp-" + kind + "-reach-" + reportMonth + ".csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { setNotice(err instanceof Error ? err.message : "Export failed"); }
    finally { setBusy(false); }
  }
  const lookup = (id: string) => data.businesses.find(b => b.id === id)?.name || "Unknown listing";
  const selected = data.businesses.filter(b => (city === "All" || b.city === city) &&
    (b.name + " " + b.category).toLowerCase().includes(search.toLowerCase()));
  const queued = data.outreach.filter(o => o.status === "queued").length;
  const pending = data.claims.filter(c => c.status === "pending");
  const changes = data.changes.filter(c => c.status === "pending");
  const candidates = data.contacts.filter(c => c.review_status === "candidate");
  return <main className="min-h-screen bg-[#faf8f2] pb-24 pt-36"><div className="mx-auto max-w-6xl px-5">
    <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#9c7430]">Private business operations</p>
    <h1 className="font-heading text-5xl font-bold text-[#183527]">Business Manager</h1>
    {!loggedIn ? <form onSubmit={async e => { e.preventDefault(); setBusy(true); try { await load(); } catch (err) { setNotice(err instanceof Error ? err.message : "Access denied"); } finally { setBusy(false); } }}
      className="mt-10 max-w-md space-y-4 rounded-xl border bg-white p-8">
      <label className="block text-sm font-semibold">Administrator access key</label>
      <input type="password" value={secret} onChange={e => setSecret(e.target.value)} autoComplete="off" required className="w-full rounded-md border p-3" />
      <button disabled={busy} className="rounded-full bg-[#183527] px-6 py-3 font-bold text-white">Open manager</button>
      {notice && <p role="alert" className="text-sm text-red-700">{notice}</p>}
    </form> : <>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Directory listings", data.businesses.length],
          ["Contacts to review", candidates.length],
          ["Pending ownership claims", pending.length],
          ["Outreach queued", queued],
          ["Invitations accepted", data.outreach.filter(o => o.status === "sent").length],
          ["Delivered", data.outreach.filter(o => o.delivery_status === "delivered").length],
          ["Bounced or complained", data.outreach.filter(o => ["bounced", "complained"].includes(o.delivery_status || "")).length],
        ].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-[#617060]">{label}</p><p className="mt-2 font-heading text-4xl font-bold text-[#183527]">{value}</p></div>)}
      </div>
      <div className="my-6 flex flex-wrap gap-3">
        <button disabled={busy} onClick={() => load().catch(e => setNotice(String(e)))} className="rounded-full border border-[#183527] px-5 py-2 text-sm font-bold text-[#183527]">Refresh dashboard</button>
        <button disabled={busy} onClick={() => action("research-batch")} className="rounded-full border border-[#183527] px-5 py-2 text-sm font-bold text-[#183527]">Research next 5 businesses</button>
        <button disabled={busy} onClick={previewEmails}
          className="rounded-full border border-[#183527] px-5 py-2 text-sm font-bold text-[#183527]">
          Preview branded emails
        </button>
        <button disabled={busy || !data.settings?.testRecipientConfigured || !data.settings?.senderConfigured}
          onClick={() => action("test-mail")} className="rounded-full border border-[#183527] px-5 py-2 text-sm font-bold text-[#183527] disabled:opacity-50">Send controlled test email</button>
        <button disabled={busy || !data.settings?.outreachEnabled}
          onClick={() => action("send")} className="rounded-full bg-[#183527] px-5 py-2 text-sm font-bold text-white disabled:opacity-40">Send up to 5 approved invitations</button>
      </div>
      <div className="mb-8 rounded-xl border border-[#e1e2d7] bg-white p-5">
        <p className="font-semibold text-[#183527]">Automation readiness</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
          {([
            ["Research", data.settings?.researchEnabled],
            ["Auto-approve eligible role inboxes", data.settings?.roleContactAutoApprove],
            ["Mail sender", data.settings?.senderConfigured],
            ["Postal address", data.settings?.postalConfigured],
            ["Delivery webhook", data.settings?.webhookConfigured],
            ["Automated outreach", data.settings?.outreachEnabled],
            ["Monthly owner reports", data.settings?.monthlyReportsEnabled],
          ] as [string, boolean | undefined][]).map(([label, ready]) =>
            <span key={label} className={"rounded-full px-3 py-2 " + (ready ? "bg-[#edf3e5] text-[#183527]" : "bg-[#f4ede8] text-[#805b3d]")}>
              {label}: {ready ? "Ready / enabled" : "Off / missing"}
            </span>)}
        </div>
        <p className="mt-3 text-sm text-[#647067]">
          Email delivery is guarded by production configuration. Research does not send mail. Sending uses a daily cap and permanent network-wide deduplication.
        </p>
      </div>
      {notice && <p role="status" className="mb-6 rounded-lg bg-[#e7efdf] p-4 text-[#183527]">{notice}</p>}

      {emailPreview && <section className="mt-9 rounded-xl border border-[#e1e2d7] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-[#8e6b2c]">Preview only · Nothing sent</p>
        <h2 className="mt-1 font-heading text-2xl font-bold text-[#183527]">Branded email preview</h2>
        <p className="mt-2 break-all text-xs text-[#667466]">From: {emailPreview.from} · Replies: {emailPreview.replyTo}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setPreviewTab("invitation")} className={"rounded-full px-4 py-2 text-sm font-bold " + (previewTab === "invitation" ? "bg-[#183527] text-white" : "border text-[#183527]")}>Listing invitation</button>
          <button type="button" onClick={() => setPreviewTab("verification")} className={"rounded-full px-4 py-2 text-sm font-bold " + (previewTab === "verification" ? "bg-[#183527] text-white" : "border text-[#183527]")}>Claim verification</button>
        </div>
        <p className="mt-4 text-sm font-semibold text-[#233b2a]">Subject: {emailPreview[previewTab].subject}</p>
        <iframe title="Branded email rendered preview" sandbox="" srcDoc={emailPreview[previewTab].html} className="mt-3 h-[820px] w-full rounded-lg border bg-[#f6f1e6]" />
        <p className="mt-3 text-xs text-[#677166]">Business and verification links shown here use sample data and are not live claims.</p>
      </section>}
      <section className="mt-10 rounded-xl border border-[#e1e2d7] bg-white p-6">
        <h2 className="font-heading text-2xl font-bold text-[#183527]">Monthly measured reach</h2>
        <p className="mt-2 text-sm leading-6 text-[#627064]">These are first-party, deduplicated tracked pageviews and referral clicks, not guaranteed unique visitors, new customers, or sales. Older Vercel analytics cannot be backfilled into this tracker.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-[#183527]" htmlFor="month-report">Completed month</label>
          <input id="month-report" type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)}
            max={new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()-1,1)).toISOString().slice(0,7)}
            className="rounded-md border p-2 text-sm" />
          <button disabled={busy} onClick={() => exportReport("business")}
            className="rounded-full border border-[#183527] px-4 py-2 text-xs font-bold text-[#183527]">Download business referrals CSV</button>
          <button disabled={busy} onClick={() => exportReport("site")}
            className="rounded-full border border-[#183527] px-4 py-2 text-xs font-bold text-[#183527]">Download site traffic CSV</button>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {(data.siteMonthly || []).filter(m => m.month.startsWith(reportMonth)).map(m =>
            <div key={m.site} className="rounded-lg bg-[#f4f6ef] p-4">
              <p className="truncate text-xs text-[#6b7568]">{m.site}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-[#183527]">{m.tracked_pageviews.toLocaleString()}</p>
              <p className="text-xs text-[#647366]">Recorded pageviews</p>
            </div>)}
        </div>
        {!data.siteMonthly?.some(m=>m.month.startsWith(reportMonth)) &&
          <p className="mt-5 text-sm text-[#697467]">No finalized tracking data for this month. Reports only begin after the tracking beacons are deployed.</p>}
        <p className="mt-4 text-xs text-[#687466]">
          Monthly owner reports: {(data.monthlyDeliveries || []).filter(m => m.month.startsWith(reportMonth) && m.status === "sent").length} sent ·{" "}
          {(data.monthlyDeliveries || []).filter(m => m.month.startsWith(reportMonth) && m.status === "queued").length} queued.
        </p>
      </section>
      <section className="mt-10"><h2 className="font-heading text-3xl font-bold text-[#183527]">Contact research review ({candidates.length})</h2>
        <div className="mt-4 space-y-3">{candidates.slice(0, 50).map(c => <div key={c.id} className="rounded-xl border bg-white p-5">
          <p className="font-semibold">{lookup(c.business_id)} <span className="font-normal text-[#6a736b]">· {c.confidence} confidence</span></p>
          <p className="mt-1 break-all text-sm">{c.email}</p>
          {c.source_url && <a href={c.source_url} className="text-xs underline" target="_blank" rel="noopener noreferrer">See source</a>}
          <div className="mt-3 flex gap-3"><button disabled={busy} onClick={() => action("approve-contact", c.id)} className="rounded-full bg-[#183527] px-4 py-2 text-xs font-bold text-white">Approve & queue</button>
          <button disabled={busy} onClick={() => action("reject-contact", c.id)} className="rounded-full border px-4 py-2 text-xs font-bold">Reject</button>
          <button disabled={busy} onClick={() => action("suppress-contact", c.id)} className="rounded-full border border-rose-300 px-4 py-2 text-xs font-bold text-rose-800">Suppress address</button></div>
        </div>)}</div></section>
      <section className="mt-12"><h2 className="font-heading text-3xl font-bold text-[#183527]">Ownership claims ({pending.length})</h2>
        <div className="mt-4 space-y-3">{pending.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5">
          <div><p className="font-semibold">{lookup(c.business_id)}</p><p className="break-all text-sm">{c.email}</p></div>
          <button disabled={busy} onClick={() => action("approve-claim", c.id)} className="rounded-full bg-[#183527] px-5 py-2 text-sm font-bold text-white">Send verification</button>
        </div>)}</div></section>
      <section className="mt-12"><h2 className="font-heading text-3xl font-bold text-[#183527]">Submitted listing edits ({changes.length})</h2>
        <div className="mt-4 space-y-3">{changes.map(c => <div key={c.id} className="rounded-xl border bg-white p-5">
          <p className="font-semibold">{lookup(c.business_id)} <span className="text-sm font-normal text-[#647067]">from {c.submitted_by}</span></p>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-[#f7f5ed] p-4 text-xs">{JSON.stringify(c.payload, null, 2)}</pre>
          <div className="mt-3 flex gap-3"><button disabled={busy} onClick={() => action("approve-edit", c.id)} className="rounded-full bg-[#183527] px-4 py-2 text-xs font-bold text-white">Approve changes</button>
          <button disabled={busy} onClick={() => action("reject-edit", c.id)} className="rounded-full border px-4 py-2 text-xs font-bold">Reject</button></div>
        </div>)}</div></section>
      <section className="mt-12"><h2 className="font-heading text-3xl font-bold text-[#183527]">Directory research</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <input placeholder="Search business or category" value={search} onChange={e => setSearch(e.target.value)} className="min-w-56 rounded-md border bg-white p-3" />
          <select value={city} onChange={e => setCity(e.target.value)} className="rounded-md border bg-white p-3">
            {["All", "Hot Springs", "Glenwood", "Mount Ida", "Murfreesboro", "Amity"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="mt-4 max-h-[620px] space-y-2 overflow-auto">
          {selected.map(b => <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
            <div className="min-w-0"><p className="font-semibold">{b.name} {b.claimed_at && <span className="text-xs text-green-700">· Claimed</span>}</p>
              <p className="text-xs text-[#6a7569]">{b.city} · {b.category} · {b.website ? "Website available" : "No website"}</p></div>
            <button disabled={busy || !b.website} onClick={() => action("research", b.id)}
              className="rounded-full border border-[#183527] px-4 py-2 text-xs font-semibold text-[#183527] disabled:opacity-40">Research contact</button>
          </div>)}
        </div>
      </section>
    </>}
  </div></main>;
}
