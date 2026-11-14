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
