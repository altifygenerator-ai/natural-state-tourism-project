"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
type Business = { id: string; name: string; city: string; description: string; phone: string | null; address: string | null; website: string | null; image_url: string | null; hours: string | null; };
const editable = ["description", "phone", "address", "website", "image_url", "hours"] as const;
export default function OwnerPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch("/api/directory/owner", { cache: "no-store" }).then(r => r.json()).then(data => {
      if (data.business) {
        setBusiness(data.business); setEmail(data.email);
        setValues(Object.fromEntries(editable.map(k => [k, data.business[k] || ""])));
      } else setMessage(data.error || "Please verify your email to continue.");
    }).catch(() => setMessage("Unable to load your listing.")).finally(() => setLoading(false));
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setMessage("");
    try {
      const r = await fetch("/api/directory/owner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await r.json(); setMessage(data.message || data.error || "Unable to save.");
    } catch { setMessage("Network error. Please try again."); }
    finally { setSaving(false); }
  }
  return <main className="min-h-screen bg-[#faf8f2] pb-24 pt-36"><div className="mx-auto max-w-3xl px-5">
    <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#9c7430]">Business owner portal</p>
    <h1 className="font-heading text-5xl font-bold text-[#183527]">Your business listing</h1>
    {loading ? <p className="mt-8">Loading listing…</p> : !business ? <div className="mt-8 rounded-xl bg-white p-8"><p>{message}</p><Link className="mt-4 inline-block underline" href="/businesses">Find your business</Link></div> :
      <><p className="mt-4 text-[#566356]">Verified as {email}. Changes go through a quick review before publishing.</p>
      <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border bg-white p-7 shadow-sm">
        <h2 className="font-heading text-2xl font-bold text-[#183527]">{business.name}</h2>
        <p className="text-sm text-[#6c766e]">{business.city}, Arkansas</p>
        {editable.map(k => <label key={k} className="block text-sm font-semibold capitalize text-[#183527]">
          {k.replace("_", " ")}
          {k === "description" || k === "hours" ?
           <textarea rows={k === "description" ? 5 : 3} maxLength={k === "description" ? 1800 : 600}
             className="mt-2 block w-full rounded-md border border-[#cdd5cc] p-3" value={values[k] || ""} onChange={e => setValues({ ...values, [k]: e.target.value })}/> :
           <input type={k === "website" || k === "image_url" ? "url" : "text"} className="mt-2 block w-full rounded-md border border-[#cdd5cc] p-3"
             value={values[k] || ""} onChange={e => setValues({ ...values, [k]: e.target.value })} />}
        </label>)}
        <button disabled={saving} className="rounded-full bg-[#183527] px-7 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Submitting…" : "Submit listing updates"}</button>
        {message && <p role="status" className="rounded-lg bg-[#edf3eb] p-4 text-sm">{message}</p>}
      </form>
      <p className="mt-5 text-sm text-[#637064]">Need to change the business name, transfer ownership, or remove a listing? <Link href="/contact" className="underline">Contact our team</Link>.</p></>}
  </div></main>;
}
