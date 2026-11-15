"use client";
export default function BusinessPhoneLink({ businessId, phone }: { businessId: string; phone: string }) {
  function record() {
    fetch("/api/directory/metrics", { method: "POST", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ event: "phone_click", business_id: businessId, placement: "business-profile" }),
      keepalive: true
    }).catch(() => {});
  }
  const dial = phone.replace(/[^0-9+]/g, "");
  return <a href={"tel:" + dial} onClick={record} className="inline-block rounded-full border border-[#cbd5c5] px-5 py-3 text-sm font-bold text-[#183527]">
    Call {phone}
  </a>;
}
