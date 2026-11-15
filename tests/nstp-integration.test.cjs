/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");
const ts = require("typescript");
const uuidBusiness = "17f9cd1e-2db5-4f12-8aa3-443cd5e40123";
const uuidClaim = "27f9cd1e-2db5-4f12-8aa3-443cd5e40123";
const uuidContact = "37f9cd1e-2db5-4f12-8aa3-443cd5e40123";
const uuidChange = "47f9cd1e-2db5-4f12-8aa3-443cd5e40123";
const token = "t".repeat(43);
process.env.NSTP_TOKEN_SECRET = "A".repeat(64);
const business = { id: uuidBusiness, city:"Glenwood", name:"Caddo Test Inn", status:"active", claimed_at:null,
  description:"Old", phone:"", address:"", website:"https://example.org", hours:"" };
const contact = {id:uuidContact,business_id:uuidBusiness,email:"info@example.org",review_status:"approved",claim_eligible:true};
const NextResponse = {
  json(data, init = {}) {
    return {status:init.status||200,data,headers:init.headers||{},json:async()=>data};
  },
  redirect(url,status=307) {
    const cookies=new Map();
    return {status,url:String(url),cookies:{set(k,v,settings){cookies.set(k,{value:v,settings})},
      get(k){return cookies.get(k)}}};
  }
};
function loadModule(path, modules = {}) {
  const source=fs.readFileSync(path,"utf8");
  const js=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true
  }}).outputText;
  const compiledModule={exports:{}};
  const mockedRequire=(name)=>{
    if(name==="next/server")return {NextResponse};
    if(Object.prototype.hasOwnProperty.call(modules,name))return modules[name];
    return require(name);
  };
  new Function("require","module","exports",js)(mockedRequire,compiledModule,compiledModule.exports);
  return compiledModule.exports;
}
const directory=loadModule("src/lib/nstp-directory.ts");
const {digest,ownerFromRequest}=directory;

test("claimed known business email -> single-use verification -> authorized edit -> admin approval",async()=>{
  const audit=[];
  const state={claim:null,owner:null,edit:null,mainBusiness:{...business}};
  const fakeDb=async(table,method="GET",params={},body)=>{
    audit.push({table,method,params,body});
    if(table==="nstp_businesses"){
      if(method==="GET")return [{...state.mainBusiness}];
      if(method==="PATCH"){Object.assign(state.mainBusiness,body);return [{...state.mainBusiness}];}
    }
    if(table==="nstp_business_contacts")return [{...contact}];
    if(table==="nstp_claim_requests"){
      if(method==="GET") {
        if(params.status==="eq.invited")return state.claim?.status==="invited" &&
          params.token_hash==="eq."+digest(token)?[{...state.claim}]:[];
        return [];
      }
      if(method==="POST"){
        state.claim={...body[0],id:uuidClaim};
        return [{...state.claim}];
      }
      if(method==="PATCH"){
        assert.equal(state.claim.status,"invited");
        Object.assign(state.claim,body);return [{...state.claim}];
      }
    }
    if(table==="nstp_business_owners"&&method==="POST"){
      state.owner=body[0];return [{...state.owner}];
    }
    if(table==="nstp_business_changes"){
      if(method==="GET")return params.status==="eq.pending"&&params.id?[{...state.edit}]:[];
      if(method==="POST"){
        state.edit={...body[0],id:uuidChange};return [{...state.edit}];
      }
      if(method==="PATCH"){Object.assign(state.edit,body);return [{...state.edit}];}
    }
    if(table==="nstp_audit")return body;
    throw Error("unexpected db "+table+" "+method);
  };
  let sentTo=null, sentHtml=null;
  const helpers={...directory, db:fakeDb, token:()=>token,
    sendMail:async(to,subject,html)=>{sentTo=to;sentHtml=html;return{id:"mail-test"};},
    requestFingerprint:()=>null, adminAllowed:()=>true
  };
  const claimRoute=loadModule("src/app/api/directory/claim/route.ts",{"@/lib/nstp-directory":helpers});
  const reply=await claimRoute.POST({json:async()=>({businessId:uuidBusiness,email:"info@example.org"})});
  assert.equal(reply.status,200);
  assert.equal(sentTo,"info@example.org");
  assert.ok(sentHtml.includes("Verify my business"));
  assert.equal(state.claim.status,"invited");
  assert.equal(state.claim.token_hash,digest(token));
  assert.equal(state.claim.email,"info@example.org");
  // Opening the link (GET) cannot mark an owner verified; only form POST does.
  const verifyRoute=loadModule("src/app/api/directory/verify/route.ts",{"@/lib/nstp-directory":helpers});
  assert.equal(typeof verifyRoute.GET,"undefined");
  const form=new FormData();form.set("id",uuidClaim);form.set("token",token);
  const verified=await verifyRoute.POST({formData:async()=>form,url:"https://www.naturalstatetourismproject.org/api/directory/verify"});
  assert.equal(verified.status,303);
  assert.ok(verified.url.endsWith("/owner"));
  assert.equal(state.claim.status,"verified");
  assert.equal(state.claim.token_hash,null);
  assert.equal(state.owner.email,"info@example.org");
  const cookie=verified.cookies.get("nstp_owner");
  assert.equal(cookie.settings.httpOnly,true);
  assert.equal(cookie.settings.sameSite,"lax");
  const session=ownerFromRequest({cookies:{get:()=>cookie}});
  assert.deepEqual(session,{b:uuidBusiness,e:"info@example.org"});
  const ownerRoute=loadModule("src/app/api/directory/owner/route.ts",{"@/lib/nstp-directory":helpers});
  const req={cookies:{get:()=>cookie},json:async()=>({description:"New description",name:"Hijack"})};
  const queued=await ownerRoute.POST(req);
  assert.equal(queued.status,200);
  assert.equal(state.edit.status,"pending");
  assert.equal(state.edit.payload.description,"New description");
  assert.equal(state.edit.payload.name,undefined);
  const adminRoute=loadModule("src/app/api/directory/admin/route.ts",{
    "@/lib/nstp-directory":helpers,
    "@/lib/nstp-workflows":{ researchBusiness:()=>{},sendClaimInvitations:()=>{}, suppressEmail:()=>{} }
  });
  const approved=await adminRoute.POST({json:async()=>({action:"approve-edit",id:uuidChange})});
  assert.equal(approved.status,200);
  assert.equal(state.mainBusiness.description,"New description");
  assert.equal(state.edit.status,"applied");
  assert.ok(audit.some(a=>a.table==="nstp_audit"&&a.method==="POST"));
});

test("unknown contact receives manual-review claim, no verification email",async()=>{
  let calls=0,created=null;
  const mock={...directory, requestFingerprint:()=>null,
    db:async(table,method,params,body)=>{
      if(table==="nstp_businesses")return [business];
      if(table==="nstp_claim_requests"&&method==="GET")return [];
      if(table==="nstp_business_contacts")return [];
      if(table==="nstp_claim_requests"&&method==="POST"){created=body[0];return [{id:uuidClaim}]}
      throw Error("unexpected db");
    },
    sendMail:async()=>{calls++;throw Error("Should never email unknown contact");}
  };
  const route=loadModule("src/app/api/directory/claim/route.ts",{"@/lib/nstp-directory":mock});
  const response=await route.POST({json:async()=>({businessId:uuidBusiness,email:"stranger@example.org"})});
  assert.equal(response.status,200);
  assert.equal(created.status,"pending");
  assert.equal(calls,0);
});

test("unauthenticated owner requests cannot submit edits",async()=>{
  const route=loadModule("src/app/api/directory/owner/route.ts",{
    "@/lib/nstp-directory":{...directory,ownerFromRequest:()=>null,db:()=>{throw Error("db should not be reached");}}
  });
  assert.equal((await route.POST({json:async()=>({description:"Injected"})})).status,401);
});

test("opt-out verifies signed link and suppresses email; invalid link cannot unsubscribe",async()=>{
  let suppressed=null;
  const mod=loadModule("src/lib/nstp-unsubscribe.ts",{
    "@/lib/nstp-directory":{...directory,db:async()=>[contact]},
    "@/lib/nstp-workflows":{suppressEmail:async(email,reason)=>{suppressed={email,reason}}}
  });
  const invalid=await mod.unsubscribeContact(uuidContact,"invalid");
  assert.equal(invalid.status,400);assert.equal(suppressed,null);
  const valid=await mod.unsubscribeContact(uuidContact,directory.unsubscribeSignature(uuidContact));
  assert.equal(valid.status,200);
  assert.deepEqual(suppressed,{email:"info@example.org",reason:"unsubscribe"});
});

test("signed bounce webhook suppresses affected email and rejects forged signature",async()=>{
  const secret=Buffer.from("secure-webhook-signing-key-123456").toString("base64");
  const old=process.env.RESEND_WEBHOOK_SECRET;
  process.env.RESEND_WEBHOOK_SECRET="whsec_"+secret;
  const event=JSON.stringify({type:"email.bounced",data:{email_id:"resend-test-message",to:["info@example.org"]}});
  const now=String(Math.floor(Date.now()/1000));
  const id="msg-test-bounce-1";
  const signed="v1,"+crypto.createHmac("sha256",Buffer.from(secret,"base64"))
    .update(id+"."+now+"."+event).digest("base64");
  const headers=new Map([["svix-id",id],["svix-timestamp",now],["svix-signature",signed]]);
  let suppressed=null,statusPatched=null;
  const route=loadModule("src/app/api/directory/webhooks/resend/route.ts",{
    "@/lib/nstp-directory":{...directory,
      db:async(table,method,params,body)=>{
        if(table==="nstp_outreach"&&method==="GET")return [{id:uuidClaim,contact_id:uuidContact}];
        if(table==="nstp_outreach"&&method==="PATCH"){statusPatched=body;return [body];}
        if(table==="nstp_business_contacts")return [contact];
        throw Error("unexpected DB "+table);
      }
    },
    "@/lib/nstp-workflows":{suppressEmail:async(email,reason)=>{suppressed={email,reason}}}
  });
  const req={headers:{get:k=>headers.get(k)},text:async()=>event};
  headers.set("svix-signature","invalid");
  assert.equal((await route.POST(req)).status,401);
  assert.equal(suppressed,null);
  headers.set("svix-signature",signed);
  assert.equal((await route.POST(req)).status,200);
  assert.equal(statusPatched.delivery_status,"bounced");
  assert.deepEqual(suppressed,{email:"info@example.org",reason:"bounce"});
  if(old===undefined)delete process.env.RESEND_WEBHOOK_SECRET;
  else process.env.RESEND_WEBHOOK_SECRET=old;
});
