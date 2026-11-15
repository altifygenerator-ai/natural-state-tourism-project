/* eslint-disable @typescript-eslint/no-require-imports */
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function moduleFor(path,mocks={}) {
  const code=ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true
  }}).outputText;
  const result={exports:{}};
  new Function("require","module","exports",code)(name=>mocks[name]||require(name),result,result.exports);
  return result.exports;
}

const configVars=["NSTP_TEST_EMAIL","RESEND_API_KEY","RESEND_WEBHOOK_SECRET","NSTP_TOKEN_SECRET","NSTP_POSTAL_ADDRESS"];
function withConfig(cb) {
  const old=Object.fromEntries(configVars.map(k=>[k,process.env[k]]));
  Object.assign(process.env,{
    NSTP_TEST_EMAIL:"naturalstatetourismproject@gmail.com",
    RESEND_API_KEY:"re_test-only",
    RESEND_WEBHOOK_SECRET:"whsec_test-only",
    NSTP_TOKEN_SECRET:"a".repeat(64),
    NSTP_POSTAL_ADDRESS:"PO Box 123, Sample Town, AR 71900"
  });
  return Promise.resolve().then(cb).finally(()=>{
    for(const [key,value] of Object.entries(old)) {
      if(value===undefined)delete process.env[key];
      else process.env[key]=value;
    }
  });
}

test("missing sender settings cannot start mailing",async()=>{
  await withConfig(async()=>{
    delete process.env.NSTP_POSTAL_ADDRESS;
    const automation=moduleFor("src/lib/nstp-automation.ts",{
      "@/lib/nstp-directory":{emailAddress:v=>typeof v==="string"&&v.includes("@")?v:null,mailFrom:()=>{},
        db:async()=>[],sendMail:async()=>{throw Error("must not send")}}
    });
    assert.match(automation.mailStartupReadiness(),/NSTP_POSTAL_ADDRESS/);
  });
});
test("one controlled invitation is accepted at most once while awaiting signed delivery",async()=>{
  await withConfig(async()=>{
    const state={id:1,research_enabled:true,outreach_requested:true,mail_test_status:"pending",
      mail_test_provider_id:null};
    const sent=[];
    const db=async(table,method,params,body)=>{
      if(table==="nstp_automation_control") {
        if(method==="GET")return [{...state}];
        if(method==="PATCH") {
          if(params.mail_test_status && params.mail_test_status !== "eq."+state.mail_test_status)return [];
          Object.assign(state,body);
          return [{...state}];
        }
      }
      if(table==="nstp_businesses")return [{id:"17f9cd1e-2db5-4f12-8aa3-443cd5e40123",name:"Example Inn",city:"Glenwood"}];
      throw Error("Unexpected "+table);
    };
    const fake={db,emailAddress: v=>typeof v==="string"&&v.includes("@")?v:null,
      mailFrom:()=> "Natural State Tourism Project <listings@naturalstatetourismproject.org>",
      outreachHtml:()=> "<p>Sample only</p>",
      sendMail:async(email,subject,html,options)=>{sent.push({email,subject,html,options});return {id:"em_test_one"};}};
    const automation=moduleFor("src/lib/nstp-automation.ts",{"@/lib/nstp-directory":fake});
    assert.equal(automation.mailStartupReadiness(),null);
    assert.equal((await automation.attemptFirstMailTest()).status,"accepted");
    assert.equal(state.mail_test_provider_id,"em_test_one");
    assert.equal(sent.length,1);
    assert.equal(sent[0].email,"naturalstatetourismproject@gmail.com");
    assert.equal(sent[0].options.idempotencyKey,"nstp-production-mail-test-v1");
    await automation.attemptFirstMailTest();
    assert.equal(sent.length,1);
  });
});
test("a failed sender test is never automatically retried",async()=>{
  await withConfig(async()=>{
    const state={id:1,research_enabled:true,outreach_requested:true,mail_test_status:"pending"};
    let attempts=0;
    const fake={db:async(table,method,params,body)=>{
      if(table==="nstp_automation_control") {
        if(method==="GET")return [{...state}];
        if(method==="PATCH"){Object.assign(state,body);return [state];}
      }
      return [{id:"17f9cd1e-2db5-4f12-8aa3-443cd5e40123",name:"Test",city:"Glenwood"}];
    },emailAddress:v=>v,mailFrom:()=>"",outreachHtml:()=>"<p></p>",
    sendMail:async()=>{attempts++;throw Error("Email provider returned 403");}};
    const automation=moduleFor("src/lib/nstp-automation.ts",{"@/lib/nstp-directory":fake});
    assert.equal((await automation.attemptFirstMailTest()).status,"failed");
    assert.equal((await automation.attemptFirstMailTest()).status,"failed");
    assert.equal(attempts,1);
  });
});
test("business invitations remain blocked until confirmed sender test and activation",async()=>{
  const workflows=moduleFor("src/lib/nstp-workflows.ts",{
    "@/lib/nstp-directory":{},
    "@/lib/nstp-automation":{getAutomationControl:async()=>({outreach_requested:true,mail_test_status:"accepted"}),
      mailStartupReadiness:()=>null}
  });
  await assert.rejects(workflows.sendClaimInvitations(5),/confirmed test email delivery/);
});
