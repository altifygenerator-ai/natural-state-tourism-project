import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
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
export type Outreach = { id: string; contact_id: string; campaign: string; status: string; attempts: number; sent_at: string | null; provider_id?: string | null; delivery_status?: string; };
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
export async function rpc<T>(name: string, body: unknown): Promise<T> {
  if (!/^nstp_[a-z_]+$/.test(name)) throw new Error("Invalid RPC");
  const key = required("NSTP_SUPABASE_SECRET_KEY");
  const url = new URL(required("NSTP_SUPABASE_URL").replace(/\/$/, "") + "/rest/v1/rpc/" + name);
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = "Bearer " + key;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" });
  if (!response.ok) throw new Error("Directory reservation failed: " + response.status);
  return await response.json() as T;
}
export function autoApprovedRoleContact(website: string, email: string, confidence: string): boolean {
  if (confidence !== "high" || !emailAddress(email) || !safePublicUrl(website)) return false;
  const origin = new URL(website);
  const websiteDomain = origin.hostname.toLowerCase().replace(/^www\./, "");
  const [local, domain] = email.toLowerCase().split("@");
  const businessRoles = new Set(["info","contact","hello","office","reservations","reservation","booking","bookings","sales","service","customerservice","frontdesk","reception","manager"]);
  return domain === websiteDomain && businessRoles.has(local);
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
export function requestFingerprint(req: NextRequest): string | null {
  const remote = (req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (!remote || remote.length > 80) return null;
  return createHmac("sha256", required("NSTP_TOKEN_SECRET")).update("claim-source:" + remote).digest("hex");
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
    const host = url.hostname.toLowerCase().replaceAll("[", "").replaceAll("]", "");
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      && !isIP(host) && host !== "localhost" && !host.endsWith(".local")
      && !host.endsWith(".internal") && !host.endsWith(".localhost")
      && (!url.port || url.port === "443" || url.port === "80");
  } catch { return false; }
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
export async function sendMail(to: string, subject: string, html: string, options: { idempotencyKey?: string; unsubscribeUrl?: string } = {}) {
  const key = required("RESEND_API_KEY");
  const from = required("NSTP_MAIL_FROM");
  if (!emailAddress(to) || to !== emailAddress(to)) throw new Error("Invalid recipient email");
  const headers: Record<string, string> = { Authorization: "Bearer " + key, "Content-Type": "application/json" };
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
  const emailHeaders = options.unsubscribeUrl ? {
    "List-Unsubscribe": "<" + options.unsubscribeUrl + ">",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
  } : undefined;
  const body = { from, to: [to], subject, html, ...(emailHeaders ? { headers: emailHeaders } : {}) };
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST", headers, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(12000)
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
  const claimUrl = ORIGIN + "/claim/" + encodeURIComponent(business.id);
  const advertisingUrl = ORIGIN + "/advertising";
  const unsubscribeUrl = ORIGIN + "/unsubscribe?c=" + encodeURIComponent(contact.id) + "&s=" + encodeURIComponent(unsubscribeSignature(contact.id));
  const postalAddress = escapeHtml(required("NSTP_POSTAL_ADDRESS"));
  const name = escapeHtml(business.name);
  const city = escapeHtml(business.city);
  const body = [
    '<p>Hi there,</p>',
    '<p>This is a business directory invitation, including information about optional paid advertising.</p>',
    '<p>We have <strong>' + name + '</strong> listed in our ' + city + ' visitor guide, part of the Natural State Tourism Project.</p>',
    '<p>We\'re building a better way for people to discover local restaurants, shops, places to stay, and services around Arkansas. Just as important, we want local business owners to be able to keep their information correct.</p>',
    '<p><strong>Claiming your basic business listing is free.</strong> You can verify ownership and submit updates to your hours, description, contact details, photos, or website for our team to review.</p>',
    '<p><a href="' + escapeHtml(claimUrl) + '" style="display:inline-block;background:#d4a753;color:#183527;padding:13px 22px;border-radius:7px;font-weight:bold;text-decoration:none">Claim your free business listing</a></p>',
    '<p>If you would like additional visibility, we also have optional <strong>featured placements starting at $20/month</strong> and <strong>business spotlight pages for $100 one time</strong>. Those are entirely separate from claiming your listing.</p>',
    '<p><a href="' + escapeHtml(advertisingUrl) + '" style="color:#183527;text-decoration:underline">See featured listing options</a></p>',
    '<p>Whether you advertise with us or not, your basic listing remains free.</p>',
    '<p>Thanks,<br><strong>Natural State Tourism Project</strong><br>Independent Arkansas tourism guides</p>'
  ].join("");
  const footer = '<p style="margin:8px 0">' + postalAddress + '</p><a href="' + escapeHtml(unsubscribeUrl) + '">Unsubscribe from future business outreach</a>';
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

type SafeResponse = { status: number; location: string; contentType: string; body: string };
async function pinnedTextRequest(url: URL, maxBytes: number, timeoutMs: number): Promise<SafeResponse> {
  // Pin the validated DNS address to the actual socket. A second DNS resolution
  // during fetch could otherwise redirect a public-looking host to a private IP.
  const candidates = await lookup(url.hostname, { all: true });
  if (!candidates.length || candidates.some(({ address, family }) =>
      family === 4 ? privateIPv4(address) :
      address === "::" || address === "::1" || address.startsWith("fc") ||
      address.startsWith("fd") || address.startsWith("fe80") ||
      address.startsWith("ff") || address.startsWith("::ffff:"))) throw new Error("Blocked unsafe website address");
  const selected = candidates.find(x => x.family === 4) || candidates[0];
  const requester = url.protocol === "https:" ? httpsRequest : httpRequest;
  return await new Promise<SafeResponse>((resolve, reject) => {
    const request = requester(url, {
      method: "GET",
      headers: {
        "User-Agent": "NaturalStateTourismDirectoryBot/1.0 (+https://www.naturalstatetourismproject.org)",
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.1",
        "Accept-Encoding": "identity"
      },
      lookup: (_hostname, _options, callback) => callback(null, selected.address, selected.family)
    }, response => {
      const contentType = String(response.headers["content-type"] || "");
      const location = String(response.headers.location || "");
      const contentLength = Number(response.headers["content-length"] || 0);
      if (contentLength > maxBytes) {
        request.destroy(new Error("Response exceeds limit"));
        return;
      }
      const chunks: Buffer[] = [];
      let length = 0;
      response.on("data", (chunk: Buffer) => {
        length += chunk.length;
        if (length > maxBytes) request.destroy(new Error("Response exceeds limit"));
        else chunks.push(chunk);
      });
      response.on("end", () => resolve({
        status: response.statusCode || 0, location, contentType,
        body: Buffer.concat(chunks).toString("utf8")
      }));
      response.on("error", reject);
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error("Website timed out")));
    request.on("error", reject);
    request.end();
  });
}
async function readPage(url: URL) {
  const baseDomain = url.hostname.replace(/^www\./, "");
  let current = url;
  for (let redirect = 0; redirect < 3; redirect++) {
    const response = await pinnedTextRequest(current, 250000, 6000);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (!response.location) return "";
      const next = await approvedHost(new URL(response.location, current).href);
      if (next.hostname.replace(/^www\./, "") !== baseDomain) return "";
      current = next;
      continue;
    }
    if (response.status < 200 || response.status >= 300 || !response.contentType.includes("text/html")) return "";
    return response.body;
  }
  return "";
}
async function blockedPaths(origin: string): Promise<string[]> {
  try {
    const url = await approvedHost(new URL("/robots.txt", origin).href);
    const response = await pinnedTextRequest(url, 40000, 3500);
    if (response.status !== 200) return [];
    const excluded: string[] = [];
    let applies = false;
    for (const raw of response.body.split(/\r?\n/)) {
      const line = raw.split("#")[0].trim();
      const [key, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      if (key?.toLowerCase() === "user-agent")
        applies = value === "*" || /NaturalStateTourismDirectoryBot/i.test(value);
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
