"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
type Props = { businessId?: string; placement?: string };
export default function TrafficBeacon({ businessId, placement = "business-profile" }: Props) {
  const path = usePathname();
  useEffect(() => {
    if (!path) return;
    const data = { event: "site_view", path };
    fetch("/api/directory/metrics", { method: "POST", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(data), keepalive: true }).catch(() => {});
  }, [path]);
  useEffect(() => {
    if (!businessId) return;
    fetch("/api/directory/metrics", { method: "POST", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ event: "profile_view", business_id: businessId, placement }), keepalive: true
    }).catch(() => {});
  }, [businessId, placement]);
  return null;
}
