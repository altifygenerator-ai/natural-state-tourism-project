import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import type { NextRequest } from "next/server";

export type Business = {
  id: string; source_site: string; source_key: string; name: string; slug: string;
  city: string; category: string; description: string; phone: string | null;
  address: string | null; website: string | null; image_url: string | null;
  listing_url: string | null; hours: string | null; status: string;
  featured: boolean; placement_type: string; claimed_at: string | null;
};
export type Contact = { id: string; business_id: string; email: string; source_url: string | null; confidence: string; review_status: string; claim_eligible: boolean; };
export type Claim = { id: string; business_id: string; email: string; status: string; token_hash: string | null; expires_at: string | null; created_at: string; };
export type Change = { id: string; business_id: string; submitted_by: string; payload: Record<string, string>; status: string; submitted_at: string; };
export type Outreach = { id: string; contact_id: string; campaign: string; status: string; attempts: number; sent_at: string | null; };
export const ORIGIN = "https://www.naturalstatetourismproject.org";
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function configured() { return Boolean(process.env.NSTP_SUPABASE_URL && process.env.NSTP_SUPABASE_SECRET_KEY); }
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(name + " is not configured");
  return value;
}
export async function db<T>(table: string, method = "GET", params: Record<string, string> = {}, body?: unknown, prefer = "return=representation"): Promise<T> {
  if (!/^nstp_[a-z_]+$/.test(table)) throw new Error("Invalid directory table");
  const key = required("NSTP_SUPABASE_SECRET_KEY");
  const url = new URL(required("NSTP_SUPABASE_URL").replace(/\/$/, "") + "/rest/v1/" + table);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const headers: Record<string, string> = { apikey: key, Prefer: prefer, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = "Bearer " + key;
  const response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  if (!response.ok) throw new Error("Directory database returned " + response.status);
  const raw = await response.text();
  return (raw ? JSON.parse(raw) : null) as T;
}
export function digest(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function token() { return randomBytes(32).toString("base64url"); }
function mac(scope: string, value: string) {
  return createHmac("sha256", required("NSTP_TOKEN_SECRET")).update(scope + ":" + value).digest("base64url");
}
function safeEqual(a: string, b: string) {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function adminAllowed(req: NextRequest) {
  const expected = process.env.NSTP_ADMIN_KEY;
  const supplied = req.headers.get("x-nstp-admin-key") || "";
  return Boolean(expected && supplied && expected.length >= 24 && safeEqual(expected, supplied));
}
export function ownerCookie(businessId: string, email: string) {
  const data = Buffer.from(JSON.stringify({ b: businessId, e: email, exp: Date.now() + 7 * 86400000 })).toString("base64url");
  return data + "." + mac("owner", data);
}
export function ownerFromRequest(req: NextRequest): { b: string; e: string } | null {
  try {
    const raw = req.cookies.get("nstp_owner")?.value || "";
    const [data, signature] = raw.split(".");
    if (!data || !signature || !safeEqual(signature, mac("owner", data))) return null;
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!UUID.test(parsed.b) || typeof parsed.e !== "string" || !Number.isFinite(parsed.exp) || parsed.exp < Date.now()) return null;
    return { b: parsed.b, e: parsed.e };
  } catch { return null; }
}
export function unsubscribeSignature(contactId: string) { return mac("unsubscribe", contactId); }
export function validUnsubscribe(contactId: string, signature: string) {
  return UUID.test(contactId) && Boolean(signature) && safeEqual(unsubscribeSignature(contactId), signature);
}
export function emailAddress(value: unknown) {
  const valueString = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(valueString) && valueString.length <= 254 ? valueString : null;
}
export function cleanChanges(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const max: Record<string, number> = { description: 1800, phone: 80, address: 300, website: 350, hours: 600, image_url: 350 };
  const out: Record<string, string> = {};
  for (const [k, maxLength] of Object.entries(max)) {
    if (typeof input[k] !== "string") continue;
    const v = input[k].trim().slice(0, maxLength);
    if ((k === "website" || k === "image_url") && v && !safePublicUrl(v)) continue;
    out[k] = v;
  }
  return out;
}
export function safePublicUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^\\[/, "").replace(/\\]$/, "");
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      && !isIP(host) && host !== "localhost" && !host.endsWith(".local")
      && !host.endsWith(".internal") && !host.endsWith(".localhost")
      && (!url.port || url.port === "443" || url.port === "80");
  } catch { return false; }
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
export async function sendMail(to: string, subject: string, html: string) {
  const key = required("RESEND_API_KEY");
  const from = required("NSTP_MAIL_FROM");
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }), cache: "no-store"
  });
  if (!resp.ok) throw new Error("Email provider returned " + resp.status);
  return await resp.json() as { id?: string };
}
function emailShell(body: string, footer = "") {
  return '<div style="background:#f6f1e6;padding:32px 12px;font-family:Arial,sans-serif;color:#203b2a"><div style="max-width:560px;margin:auto;background:white;border:1px solid #e7e0d2;border-radius:12px;overflow:hidden"><div style="background:#183527;color:#fff;padding:26px;text-align:center"><img src="' + ORIGIN + '/images/logo.png" width="54" height="54" alt="Natural State Tourism Project" style="margin:auto auto 10px"><div style="font-size:17px;font-weight:700;letter-spacing:.8px">NATURAL STATE TOURISM PROJECT</div></div><div style="padding:30px;line-height:1.7">' + body + '</div><div style="padding:20px 30px;background:#f7f4ed;color:#596458;font-size:12px;line-height:1.7">Independent Arkansas tourism guides.' + footer + '</div></div></div>';
}
export function claimHtml(business: Business, url: string) {
  return emailShell('<p>We received a request to verify ownership of <strong>' + escapeHtml(business.name) + '</strong>.</p><p>If this was you, use the secure link below to confirm your email and access the listing editor. The link expires in 24 hours.</p><p><a href="' + escapeHtml(url) + '" style="display:inline-block;background:#183527;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Verify my business</a></p><p>If you did not request this, you can ignore this email.</p>');
}
export function outreachHtml(business: Business, contact: Contact) {
  const claimUrl = ORIGIN + "/claim/" + business.id;
  const unsubscribeUrl = ORIGIN + "/unsubscribe?c=" + contact.id + "&s=" + unsubscribeSignature(contact.id);
  const address = escapeHtml(required("NSTP_POSTAL_ADDRESS"));
  const body = '<p>Hi there,</p><p><strong>' + escapeHtml(business.name) + '</strong> is listed in our ' + escapeHtml(business.city) + ' Arkansas tourism directory. We are inviting local owners to verify their listing and keep it accurate for visitors.</p><p>Claiming and updating your basic listing is <strong>free</strong>.</p><p>You can review your details, suggest changes to hours, contact information, photos and your website.</p><p><a href="' + claimUrl + '" style="display:inline-block;background:#183527;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Claim your free listing</a></p><p>Thanks,<br>Natural State Tourism Project</p><p style="font-size:12px;color:#777">This is an introduction to our independent Arkansas tourism directory.</p>';
  const footer = '<p style="margin:8px 0">' + address + '</p><a href="' + escapeHtml(unsubscribeUrl) + '">Unsubscribe from future outreach</a>';
  return emailShell(body, footer);
}
function privateIPv4(ip: string) {
  const p = ip.split(".").map(Number);
  return p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224 ||
    (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
    (p[0] === 192 && p[1] === 0 && p[2] === 0) || (p[0] === 198 && (p[1] === 18 || p[1] === 19));
}
async function approvedHost(urlString: string): Promise<URL> {
  if (!safePublicUrl(urlString)) throw new Error("Unsafe website URL");
  const url = new URL(urlString);
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address, family }) => family === 4 ? privateIPv4(address) :
      address === "::1" || address === "::" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80") || address.startsWith("::ffff:"))) {
    throw new Error("Private or unavailable host");
  }
  return url;
}

async function readPage(url: URL) {
  const baseDomain = url.hostname.replace(/^www\./, "");
  let current = url;
  for (let redirect = 0; redirect < 3; redirect++) {
    const resp = await fetch(current, { signal: AbortSignal.timeout(6500), redirect: "manual",
      headers: { "User-Agent": "NaturalStateTourismDirectoryBot/1.0 (+https://www.naturalstatetourismproject.org)" } });
    if ([301, 302, 303, 307, 308].includes(resp.status)) {
      const location = resp.headers.get("location");
      if (!location) return "";
      const next = await approvedHost(new URL(location, current).href);
      if (next.hostname.replace(/^www\./, "") !== baseDomain) return "";
      current = next;
      continue;
    }
    if (!resp.ok || !(resp.headers.get("content-type") || "").includes("text/html")) return "";
    const length = Number(resp.headers.get("content-length") || 0);
    if (length > 300000) return "";
    return (await resp.text()).slice(0, 300000);
  }
  return "";
}
async function blockedPaths(origin: string): Promise<string[]> {
  try {
    const url = await approvedHost(new URL("/robots.txt", origin).href);
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(3500) });
    if (!response.ok) return [];
    const text = (await response.text()).slice(0, 40000);
    const excluded: string[] = [];
    let applies = false;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.split("#")[0].trim();
      const [key, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      if (key?.toLowerCase() === "user-agent") applies = value === "*" || /NaturalStateTourismDirectoryBot/i.test(value);
      if (applies && key?.toLowerCase() === "disallow" && value.startsWith("/")) excluded.push(value);
    }
    return excluded;
  } catch { return []; }
}
export async function researchEmails(website: string): Promise<{ email: string; source_url: string; confidence: string }[]> {
  const root = await approvedHost(website);
  if (["facebook.com", "instagram.com", "google.com", "tripadvisor.com", "yelp.com"].some(d => root.hostname === d || root.hostname.endsWith("." + d))) return [];
  const origin = root.origin;
  const pages = [root.href, new URL("/contact", origin).href, new URL("/contact-us", origin).href];
  const disallowed = await blockedPaths(origin);
  const results = new Map<string, { email: string; source_url: string; confidence: string }>();
  for (const page of [...new Set(pages)].slice(0, 3)) {
    const url = await approvedHost(page);
    if (disallowed.some(path => url.pathname.startsWith(path))) continue;
    const html = await readPage(url).catch(() => "");
    for (const match of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) {
      const email = emailAddress(match[0]);
      if (!email || /example\.|sentry\.|wixpress\.|cloudflare\.|wordpress\.|gravatar\.|schema\.org/.test(email)) continue;
      const host = email.split("@")[1];
      const isOwnDomain = host === root.hostname.replace(/^www\./, "") || root.hostname.endsWith("." + host);
      if (!results.has(email)) results.set(email, { email, source_url: page, confidence: isOwnDomain ? "high" : "medium" });
    }
  }
  return [...results.values()].slice(0, 8);
}
