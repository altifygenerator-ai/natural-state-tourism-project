/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function load(path, mappings = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true
  }}).outputText;
  const compiledModule = { exports: {} };
  new Function("require","module","exports",code)(
    name => Object.prototype.hasOwnProperty.call(mappings,name) ? mappings[name] : require(name),
    compiledModule, compiledModule.exports
  );
  return compiledModule.exports;
}
const directory = load("src/lib/nstp-directory.ts");
process.env.NSTP_TOKEN_SECRET = "testing-signing-key-".repeat(3);
const captured = [];
const metrics = load("src/lib/nstp-metrics.ts", { "@/lib/nstp-directory": {
  ...directory, db: async (table,method,params,body) => {
    captured.push({table,method,params,body}); return [];
  }
}});
test("only known guide origins can contribute to network reports",()=>{
  assert.equal(metrics.allowedSite("https://www.glenwoodarkansas.org"),"glenwoodarkansas.org");
  assert.equal(metrics.allowedSite("https://hotspringsarkansas.org"),"hotspringsarkansas.org");
  assert.equal(metrics.allowedSite("https://murfreesboroarkansas.org.attacker.tld"),null);
  assert.equal(metrics.allowedSite("javascript:bad"),null);
  assert.equal(metrics.allowedSite(null),null);
});
test("URL matching excludes tracking parameters and private destinations",()=>{
  assert.equal(metrics.canonicalWebsite("https://www.example.org/visitor/?utm_source=guide"),"example.org/visitor");
  assert.equal(metrics.canonicalWebsite("https://example.org/visitor"),"example.org/visitor");
  assert.equal(metrics.canonicalWebsite("http://localhost/"),null);
});
test("bot and prefetch requests are not counted",()=>{
  const make = a => ({headers:{get:key=>key==="user-agent"?a:null}});
  assert.equal(metrics.isLikelyAutomated(make("Googlebot/2.1")),true);
  assert.equal(metrics.isLikelyAutomated(make("Mozilla/5.0 Chrome/120.0")),false);
  assert.equal(metrics.isLikelyAutomated({headers:{get:key=>key==="purpose"?"prefetch":"Mozilla/5.0"}}),true);
});
test("tracked events store neither raw IP nor user-agent",async()=>{
  captured.length=0;
  const req={headers:{get:key=>key==="x-forwarded-for"?"203.0.113.28":key==="user-agent"?"Mozilla/5.0":null}};
  assert.equal(await metrics.recordSiteView(req,"glenwoodarkansas.org","/restaurants"),true);
  assert.equal(await metrics.recordBusinessInteraction(req,"17f9cd1e-2db5-4f12-8aa3-443cd5e40123",
    "website_click","glenwoodarkansas.org","city-guide-external"),true);
  assert.equal(captured.length,2);
  const json=JSON.stringify(captured);
  assert.ok(!json.includes("203.0.113.28"));assert.ok(!json.includes("Mozilla"));
  assert.equal(captured[0].table,"nstp_site_pageviews");
  assert.equal(captured[1].table,"nstp_business_interactions");
});
test("restricted paths are not counted as guide pageviews",async()=>{
  const req={headers:{get:()=>null}};
  assert.equal(await metrics.recordSiteView(req,"glenwoodarkansas.org","/owner"),false);
  assert.equal(await metrics.recordSiteView(req,"glenwoodarkansas.org","/api/test"),false);
});
const monthly = load("src/lib/nstp-monthly.ts", { "@/lib/nstp-directory": directory });
test("monthly reporting uses completed months and handles January",()=>{
  assert.equal(monthly.lastCompletedMonth(new Date("2026-01-05T00:00:00Z")),"2025-12-01");
  assert.equal(monthly.lastCompletedMonth(new Date("2026-11-14T12:00:00Z")),"2026-10-01");
});
test("report distinguishes business referrals from whole guide traffic",()=>{
  const html=monthly.reportHtml("A&B <Inn>","Glenwood","2026-10-01",
    {month:"2026-10-01",profile_views:42,website_clicks:11,phone_clicks:3},
    1200,"17f9cd1e-2db5-4f12-8aa3-443cd5e40123");
  assert.ok(html.includes("A&amp;B &lt;Inn&gt;"));
  assert.ok(!html.includes("A&B <Inn>"));
  assert.ok(html.includes("1,200"));
  assert.ok(html.includes("not</strong> visits to your individual business"));
  assert.ok(html.includes("do not prove unique visitors"));
});
