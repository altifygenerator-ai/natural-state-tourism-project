/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const target = "src/app/api/directory/public/route.ts";
const source = fs.readFileSync(target,"utf8");
const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
function load(dbImpl) {
 const moduleObject={exports:{}};
 const NextResponse={json:(value,options={})=>({value,status:options.status||200,options})};
 const mocks={"next/server":{NextResponse},
 "@/lib/nstp-directory":{db:dbImpl,cleanChanges:(payload)=>{
   const allowed=["description","phone","address","website","hours","image_url"];
   return Object.fromEntries(Object.entries(payload||{}).filter(([k,v])=>allowed.includes(k)&&typeof v==="string"));
 }}};
 new Function("require","module","exports",js)(name=>mocks[name]||require(name),moduleObject,moduleObject.exports);
 return moduleObject.exports;
}
test("public sync exposes only admin-approved edits and never pending private contacts",async()=>{
 const calls=[];
 const route=load(async(table,method,params)=>{
   calls.push({table,method,params});
   if(table==="nstp_businesses")return [
     {id:"111",name:"Caddo Cafe",source_site:"glenwoodarkansas.org",source_key:"caddo-cafe",city:"Glenwood"},
     {id:"222",name:"Sample Inn",source_site:"glenwoodarkansas.org",source_key:"sample-inn",city:"Glenwood"}
   ];
   if(table==="nstp_business_changes")return [
     {business_id:"111",payload:{description:"First reviewed",owner_email:"secret@example.org"}},
     {business_id:"111",payload:{phone:"870-555-1234",description:"Updated reviewed"}},
     {business_id:"222",payload:{contact_email:"private@example.org"}}
   ];
   throw Error("Unexpected table");
 });
 const req={nextUrl:{searchParams:new URLSearchParams("city=Glenwood")}};
 const result=await route.GET(req);
 assert.equal(result.status,200);
 const [first,second]=result.value.businesses;
 assert.deepEqual(first.approved_overrides,{description:"Updated reviewed",phone:"870-555-1234"});
 assert.deepEqual(second.approved_overrides,{});
 assert.ok(!JSON.stringify(result.value).includes("secret@example.org"));
 assert.ok(!JSON.stringify(result.value).includes("private@example.org"));
 assert.equal(calls[1].params.status,"eq.applied");
 assert.ok(result.options.headers["Cache-Control"].includes("s-maxage=300"));
});
test("public sync rejects unrecognized cities before database access",async()=>{
 const route=load(async()=>{throw Error("DB called by invalid request")});
 const out=await route.GET({nextUrl:{searchParams:new URLSearchParams("city=OutsideTown")}});
 assert.equal(out.status,400);
});
