/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const input = fs.readFileSync("src/lib/nstp-directory.ts", "utf8");
const compiled = ts.transpileModule(input, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true
} }).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", compiled)(require, mod, mod.exports);
const directory = mod.exports;
process.env.NSTP_TOKEN_SECRET = "a".repeat(64);

test("validates real email shapes without inventing addresses", () => {
  assert.equal(directory.emailAddress("  INFO@Example.com "), "info@example.com");
  assert.equal(directory.emailAddress("not-an-email"), null);
  assert.equal(directory.emailAddress("x@localhost"), null);
  assert.equal(directory.emailAddress(123), null);
});
test("rejects private and non-web website URLs", () => {
  for (const v of ["javascript:alert(1)", "http://127.0.0.1", "http://[::1]", "https://localhost",
    "https://sub.internal", "ftp://example.com", "http://example.com:9000", "https://user:pass@example.com"]) {
    assert.equal(directory.safePublicUrl(v), false, v);
  }
  assert.equal(directory.safePublicUrl("https://example.com/contact"), true);
});
test("sanitizes business fields and blocks untrusted keys", () => {
  assert.deepEqual(directory.cleanChanges({ name: "Hijacked", description: "Updated", phone: "123", website: "javascript:alert(1)" }),
    { description: "Updated", phone: "123" });
});
test("prevents HTML injection in outbound mail", () => {
  assert.equal(directory.escapeHtml('<img src="x" onerror="bad">'),
    "&lt;img src=&quot;x&quot; onerror=&quot;bad&quot;&gt;");
});
test("verifies signed owner session and rejects tampering", () => {
  const uuid = "17f9cd1e-2db5-4f12-8aa3-443cd5e40123";
  const cookie = directory.ownerCookie(uuid, "contact@example.com");
  assert.deepEqual(directory.ownerFromRequest({ cookies: { get: () => ({ value: cookie }) } }),
    { b: uuid, e: "contact@example.com" });
  assert.equal(directory.ownerFromRequest({ cookies: { get: () => ({ value: cookie + "tamper" }) } }), null);
  assert.equal(directory.ownerFromRequest({ cookies: { get: () => undefined } }), null);
});
test("requires valid signed unsubscribe token", () => {
  const id = "17f9cd1e-2db5-4f12-8aa3-443cd5e40123";
  const sig = directory.unsubscribeSignature(id);
  assert.equal(directory.validUnsubscribe(id, sig), true);
  assert.equal(directory.validUnsubscribe(id, sig + "0"), false);
  assert.equal(directory.validUnsubscribe("bad-id", sig), false);
});
test("server database operations use secret apikey without exposing it in URL", async () => {
  process.env.NSTP_SUPABASE_URL = "https://example.supabase.co";
  process.env.NSTP_SUPABASE_SECRET_KEY = "sb_secret_testing_only";
  const original = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url.origin, "https://example.supabase.co");
    assert.equal(options.headers.apikey, "sb_secret_testing_only");
    assert.equal(options.headers.Authorization, undefined);
    return { ok: true, text: async () => '[{"id":"ok"}]' };
  };
  try { assert.deepEqual(await directory.db("nstp_businesses", "GET"), [{ id: "ok" }]); }
  finally { global.fetch = original; }
});

test("business invitation uses free claim as primary action and paid offers stay optional", () => {
  process.env.NSTP_POSTAL_ADDRESS = "123 Example Street, Sample Town, AR 00000";
  const business = {
    id: "17f9cd1e-2db5-4f12-8aa3-443cd5e40123",
    name: 'Example & Sons <Test>',
    city: "Glenwood",
  };
  const contact = { id: "27f9cd1e-2db5-4f12-8aa3-443cd5e40123" };
  const html = directory.outreachHtml(business, contact);
  assert.ok(html.includes("Claim your free business listing"));
  assert.ok(html.includes("featured placements starting at $20/month"));
  assert.ok(html.includes("business spotlight pages for $100 one time"));
  assert.ok(html.includes("Whether you advertise with us or not"));
  assert.ok(html.includes("/advertising"));
  assert.ok(html.includes("/unsubscribe?c="));
  assert.ok(html.includes("Example &amp; Sons &lt;Test&gt;"));
  assert.ok(!html.includes("Example & Sons <Test>"));
  delete process.env.NSTP_POSTAL_ADDRESS;
});


test("trusted role inboxes qualify; personal and third-party emails stay for review", () => {
  assert.equal(directory.autoApprovedRoleContact("https://caddoriver.com", "info@caddoriver.com", "high"), true);
  assert.equal(directory.autoApprovedRoleContact("https://caddoriver.com", "bookings@caddoriver.com", "high"), true);
  assert.equal(directory.autoApprovedRoleContact("https://caddoriver.com", "jane@caddoriver.com", "high"), false);
  assert.equal(directory.autoApprovedRoleContact("https://caddoriver.com", "info@gmail.com", "high"), false);
  assert.equal(directory.autoApprovedRoleContact("https://caddoriver.com", "info@caddoriver.com", "medium"), false);
  assert.equal(directory.autoApprovedRoleContact("http://localhost", "info@localhost", "high"), false);
});

test("outreach email adds idempotency and one-click unsubscribe", async () => {
  const original = global.fetch;
  const oldKey = process.env.RESEND_API_KEY;
  const oldSender = process.env.NSTP_MAIL_FROM;
  process.env.RESEND_API_KEY = "re_test";
  process.env.NSTP_MAIL_FROM = "Natural State Tourism Project <listings@naturalstatetourismproject.org>";
  const unsubscribe = "https://www.naturalstatetourismproject.org/api/directory/unsubscribe/one-click?c=test&s=token";
  global.fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.headers["Idempotency-Key"], "campaign-job-1");
    const msg = JSON.parse(options.body);
    assert.equal(msg.from, "Natural State Tourism Project <listings@naturalstatetourismproject.org>");
    assert.equal(msg.reply_to, "naturalstatetourismproject@gmail.com");
    assert.equal(msg.headers["List-Unsubscribe"], "<" + unsubscribe + ">");
    assert.equal(msg.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    return { ok: true, json: async () => ({ id: "message-id" }) };
  };
  try {
    const msg = await directory.sendMail("info@example.org", "Test", "<p>Test</p>",
      { idempotencyKey: "campaign-job-1", unsubscribeUrl: unsubscribe });
    assert.equal(msg.id, "message-id");
  } finally {
    global.fetch = original;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
    if (oldSender === undefined) delete process.env.NSTP_MAIL_FROM; else process.env.NSTP_MAIL_FROM = oldSender;
  }
});

test("reservation RPC is authenticated using the server-only Supabase key", async () => {
  const original = global.fetch;
  const oldUrl = process.env.NSTP_SUPABASE_URL, oldKey = process.env.NSTP_SUPABASE_SECRET_KEY;
  process.env.NSTP_SUPABASE_URL = "https://example.supabase.co";
  process.env.NSTP_SUPABASE_SECRET_KEY = "sb_secret_test";
  global.fetch = async (url, options) => {
    assert.equal(url.pathname, "/rest/v1/rpc/nstp_reserve_outreach");
    assert.equal(options.headers.apikey, "sb_secret_test");
    assert.equal(JSON.parse(options.body).p_limit, 5);
    return { ok: true, json: async () => [] };
  };
  try { assert.deepEqual(await directory.rpc("nstp_reserve_outreach", { p_limit: 5 }), []); }
  finally {
    global.fetch = original;
    if (oldUrl === undefined) delete process.env.NSTP_SUPABASE_URL; else process.env.NSTP_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.NSTP_SUPABASE_SECRET_KEY; else process.env.NSTP_SUPABASE_SECRET_KEY = oldKey;
  }
});

test("new domain is used by default and an obsolete From identity is rejected", () => {
  const old = process.env.NSTP_MAIL_FROM;
  delete process.env.NSTP_MAIL_FROM;
  try {
    assert.equal(directory.mailFrom(), directory.DEFAULT_NSTP_MAIL_FROM);
    assert.equal(directory.mailReplyTo(), "naturalstatetourismproject@gmail.com");
    process.env.NSTP_MAIL_FROM = "Natural State <no-reply@hometownwebservicesar.cc>";
    assert.throws(() => directory.mailFrom(), /verified naturalstatetourismproject.org/);
  } finally {
    if (old === undefined) delete process.env.NSTP_MAIL_FROM;
    else process.env.NSTP_MAIL_FROM = old;
  }
});
test("email preview can render without a configured real postal address, but production cannot", () => {
  const old = process.env.NSTP_POSTAL_ADDRESS;
  delete process.env.NSTP_POSTAL_ADDRESS;
  const b = { id: "17f9cd1e-2db5-4f12-8aa3-443cd5e40123", name: "Example Local Shop", city: "Hot Springs" };
  const c = { id: "27f9cd1e-2db5-4f12-8aa3-443cd5e40123" };
  try {
    const html = directory.outreachHtml(b, c, {previewPostalAddress: "[Configure your real postal address]"});
    assert.ok(html.includes("[Configure your real postal address]"));
    assert.throws(() => directory.outreachHtml(b, c), /NSTP_POSTAL_ADDRESS/);
    assert.ok(html.includes("Claim your free business listing"));
    assert.ok(html.includes("naturalstatetourismproject.org"));
  } finally {
    if (old === undefined) delete process.env.NSTP_POSTAL_ADDRESS;
    else process.env.NSTP_POSTAL_ADDRESS = old;
  }
});

test("business manager admin access requires matching Production key of 24+ characters", () => {
  const original = process.env.NSTP_ADMIN_KEY;
  const request = value => ({headers:{get:name=>name === "x-nstp-admin-key" ? value : null}});
  try {
    process.env.NSTP_ADMIN_KEY = "short-key";
    assert.equal(directory.adminAllowed(request("short-key")),false);
    process.env.NSTP_ADMIN_KEY = "long-and-private-admin-key-at-least-24-characters";
    assert.equal(directory.adminAllowed(request("long-and-private-admin-key-at-least-24-characters")),true);
    assert.equal(directory.adminAllowed(request("long-and-private-admin-key-at-least-24-characterS")),false);
    assert.equal(directory.adminAllowed(request("")),false);
  } finally {
    if (original === undefined) delete process.env.NSTP_ADMIN_KEY;
    else process.env.NSTP_ADMIN_KEY = original;
  }
});

test("admin session permits same-origin actions after initial key login, then expires securely", () => {
  const previous = process.env.NSTP_ADMIN_KEY;
  process.env.NSTP_ADMIN_KEY = "long-and-private-admin-key-at-least-24-characters";
  const headers = (key, origin) => ({ get(name) {
    if (name === "x-nstp-admin-key") return key || null;
    if (name === "origin") return origin || null;
    return null;
  }});
  const req = (key, cookie, method = "GET", origin = null) => ({
    headers: headers(key, origin), method, nextUrl: { origin: "https://www.naturalstatetourismproject.org" },
    cookies: { get(name) { return name === directory.ADMIN_SESSION_COOKIE && cookie
      ? { value: cookie } : undefined; } }
  });
  try {
    assert.equal(directory.adminKeyAllowed(req("long-and-private-admin-key-at-least-24-characters")), true);
    const session = directory.adminSessionCookie();
    assert.equal(directory.adminAllowed(req(null, session)), true);
    assert.equal(directory.adminAllowed(req(null, session, "POST", "https://www.naturalstatetourismproject.org")), true);
    assert.equal(directory.adminAllowed(req(null, session, "POST", "https://evil.example")), false);
    assert.equal(directory.adminAllowed(req(null, session, "POST", null)), false);
    assert.equal(directory.adminAllowed(req(null, session + "tampered")), false);
    process.env.NSTP_ADMIN_KEY = "another-different-admin-key-at-least-24-characters";
    assert.equal(directory.adminAllowed(req(null, session)), false);
  } finally {
    if (previous === undefined) delete process.env.NSTP_ADMIN_KEY;
    else process.env.NSTP_ADMIN_KEY = previous;
  }
});
