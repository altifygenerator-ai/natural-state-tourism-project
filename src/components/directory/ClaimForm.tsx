"use client";
import { FormEvent, useState } from "react";
export default function ClaimForm({ businessId }: { businessId: string }) {
  const [email, setEmail] = useState("");
  const [websiteExtra, setWebsiteExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const r = await fetch("/api/directory/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, email, website_extra: websiteExtra }) });
      const data = await r.json();
      setMessage(data.message || data.error || "Unable to submit your request.");
    } catch { setMessage("Unable to reach the server. Please try again."); }
    finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border border-[#e4e4db] bg-white p-7 shadow-sm">
    <div style={{ position: "absolute", left: "-10000px" }} aria-hidden="true">
      <label htmlFor="business-extra">Leave this field blank</label>
      <input id="business-extra" type="text" tabIndex={-1} autoComplete="off" value={websiteExtra} onChange={e => setWebsiteExtra(e.target.value)} />
    </div>
    <label className="block text-sm font-bold text-[#183527]" htmlFor="business-email">Your business email address</label>
    <input id="business-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
      placeholder="you@yourbusiness.com" className="w-full rounded-md border border-[#cdd5cc] px-4 py-3 text-[#183527] outline-offset-4" />
    <p className="text-sm leading-6 text-[#657064]">We will verify your email against known business contact information. New requests may require a manual ownership check. Claiming your listing is free.</p>
    <button type="submit" disabled={loading} className="rounded-full bg-[#183527] px-6 py-3 font-bold text-white disabled:opacity-60">{loading ? "Submitting…" : "Request my free listing"}</button>
    {message && <p role="status" className="rounded-lg bg-[#edf3eb] p-4 text-sm text-[#183527]">{message}</p>}
  </form>;
}
