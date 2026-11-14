"use client";
import { useState } from "react";
export default function UnsubscribeForm({ contactId, signature }: { contactId: string; signature: string }) {
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  async function submit() {
    setWorking(true);
    try {
      const r = await fetch("/api/directory/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, signature }) });
      const data = await r.json(); setMessage(data.message || data.error || "Unable to process.");
    } catch { setMessage("Please try again."); }
    finally { setWorking(false); }
  }
  return <div className="mt-8 rounded-xl border bg-white p-7">
    <button type="button" disabled={working || Boolean(message.includes("unsubscribed"))} onClick={submit}
      className="rounded-full bg-[#183527] px-6 py-3 font-semibold text-white disabled:opacity-60">Unsubscribe me</button>
    {message && <p role="status" className="mt-4 text-sm text-[#183527]">{message}</p>}
  </div>;
}
