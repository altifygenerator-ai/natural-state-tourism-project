import { createHmac, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { Business, UUID, db, safePublicUrl } from "@/lib/nstp-directory";

const siteCities: Record<string, string | null> = {
  "naturalstatetourismproject.org": null,
  "glenwoodarkansas.org": "Glenwood",
  "hotspringsarkansas.org": "Hot Springs",
  "mountidaarkansas.org": "Mount Ida",
  "murfreesboroarkansas.org": "Murfreesboro",
  "amityarkansas.org": "Amity",
};
export type MetricEvent = "profile_view" | "website_click" | "phone_click" | "site_view";
export function allowedSite(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) return null;
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return Object.prototype.hasOwnProperty.call(siteCities, host) ? host : null;
  } catch { return null; }
}
export function corsHeaders(origin: string | null) {
  const site = allowedSite(origin);
  return site ? { "Access-Control-Allow-Origin": origin!, "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin",
    "Cache-Control": "no-store" } : { "Cache-Control": "no-store" };
}
export function isLikelyAutomated(req: NextRequest) {
  const agent = req.headers.get("user-agent") || "";
  return !agent || /bot|crawler|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python|node-fetch|vercel|pagespeed|pingdom/i.test(agent)
    || /prefetch|prerender/i.test((req.headers.get("sec-purpose") || "") + (req.headers.get("purpose") || ""));
}
export function visitorBucket(req: NextRequest, scope: string) {
  // No raw IP or user-agent is stored. Fingerprint rotates every 15 minutes.
  const ip = (req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const visitor = ip ? ip.slice(0, 75) : randomBytes(16).toString("hex");
  const agent = (req.headers.get("user-agent") || "").slice(0, 180);
  const slot = Math.floor(Date.now() / 900000);
  const secret = process.env.NSTP_TOKEN_SECRET;
  if (!secret) throw new Error("Missing metric signing secret");
  return createHmac("sha256", secret).update([scope,slot,visitor,agent].join("|")).digest("hex");
}
export function canonicalWebsite(value: string) {
  try {
    if (!safePublicUrl(value)) return null;
    const url = new URL(value);
    return url.hostname.toLowerCase().replace(/^www\./, "") + url.pathname.replace(/\/+$/, "");
  } catch { return null; }
}
export async function recordBusinessInteraction(req: NextRequest,
  businessId: string, type: "profile_view" | "website_click" | "phone_click",
  site: string, placement: string
) {
  if (!UUID.test(businessId) || !Object.hasOwn(siteCities, site)) return false;
  await db("nstp_business_interactions", "POST", { on_conflict: "business_id,event_type,source_site,placement,visitor_bucket" },
    [{ business_id: businessId, event_type: type, source_site: site,
      placement: placement.slice(0, 60), visitor_bucket: visitorBucket(req, businessId + type + site + placement) }],
    "resolution=ignore-duplicates,return=minimal");
  return true;
}
export async function recordSiteView(req: NextRequest, site: string, path: string) {
  if (!Object.hasOwn(siteCities, site) || !path.startsWith("/") || path.length > 200) return false;
  // Avoid tracking admin, claim-token URLs and account sessions.
  if (/^\/(api|manage-businesses|verify-business|owner|unsubscribe|claim)(\/|$)/.test(path)) return false;
  await db("nstp_site_pageviews", "POST", { on_conflict: "site,path,visitor_bucket" },
    [{ site, path, visitor_bucket: visitorBucket(req, site + path) }],
    "resolution=ignore-duplicates,return=minimal");
  return true;
}
export async function matchOfficialBusiness(site: string, href: string): Promise<Business | null> {
  const city = siteCities[site];
  if (!city) return null;
  const destination = canonicalWebsite(href);
  if (!destination) return null;
  const list = await db<Business[]>("nstp_businesses", "GET", {
    city: "eq." + city, status: "eq.active", website: "not.is.null",
    select: "id,website,city,status", limit: "600"
  });
  const matches = list.filter(b => b.website && canonicalWebsite(b.website) === destination);
  return matches.length === 1 ? matches[0] : null;
}
