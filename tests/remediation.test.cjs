const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const backend = require('./fake-database.cjs');
const { NextResponse, NextRequest } = require('next/server');
const cryptoModule = env => load('src/lib/crypto.ts', {}, env);

test('encrypted credentials reject wrong keys, tampering and malformed ciphertext', () => {
  const original = cryptoModule({ ENCRYPTION_KEY: 'test-key-a', NODE_ENV: 'production' });
  const cipher = original.encryptToken('private-value');
  assert.equal(original.decryptToken(cipher), 'private-value');
  assert.throws(() => cryptoModule({ ENCRYPTION_KEY: 'test-key-b', NODE_ENV: 'production' }).decryptToken(cipher), /could not be decrypted/);
  assert.throws(() => original.decryptToken(cipher.slice(0,-2) + (parseInt(cipher.slice(-2),16)^1).toString(16).padStart(2,'0')), /could not be decrypted/);
  assert.throws(() => original.decryptToken('enc:gcm:broken'), /could not be decrypted/);
});
test('production encryption never silently stores plaintext without its encryption key', () => {
  assert.throws(() => cryptoModule({ NODE_ENV: 'production' }).encryptToken('secret'), /could not be decrypted/);
});
test('signature validation rejects malformed digest and verifies exact raw bytes', () => {
  const crypto = require('node:crypto'); const h = cryptoModule({});
  const raw = '{"message":"hello"}'; const signature = 'sha256=' + crypto.createHmac('sha256','test-secret').update(raw).digest('hex');
  assert.equal(h.verifyMetaSignature(raw, signature, 'test-secret'), true);
  assert.equal(h.verifyMetaSignature(raw + ' ', signature, 'test-secret'), false);
  assert.equal(h.verifyMetaSignature(raw, signature + 'zz', 'test-secret'), false);
});
test('companies and templates survive new repository instances and isolate tenants', async () => {
  const b = backend(); b.tables.companies=[]; b.tables.templates=[];
  const repo = () => load('src/lib/db/business.ts', { './client': b.client });
  const company = await repo().CompaniesDB.upsert({ name: 'Company A' }, 'ws-a');
  assert.match(company.id, /^[a-f0-9-]{36}$/);
  assert.equal((await repo().CompaniesDB.list('ws-a')).length, 1);
  assert.equal((await repo().CompaniesDB.list('ws-b')).length, 0);
  await assert.rejects(repo().CompaniesDB.upsert({ id: company.id, name: 'Hijack' }, 'ws-b'), /not found/);
  await repo().TemplatesDB.upsert({ id:'provider-123',name:'hello',language:'en_US',status:'APPROVED',category:'UTILITY',body:'Hello' }, 'ws-a');
  assert.equal((await repo().TemplatesDB.list('ws-b')).length, 0);
  assert.equal(b.tables.templates[0].meta_template_id,'provider-123');
  assert.notEqual(b.tables.templates[0].id,'provider-123');
});
test('settings allow explicit credential replacement without decrypting broken old values', async () => {
  const b=backend(); b.tables.workspaces.push({id:'ws-a',name:'A'}); b.tables.meta_connections.push({workspace_id:'ws-a',access_token_encrypted:'broken',app_secret_encrypted:'broken'});
  const { SettingsDB }=load('src/lib/db/settings.ts',{'./client':b.client,'@/lib/crypto':{decryptToken(value){if(value==='broken')throw Error('broken');return value;},encryptToken:v=>v}});
  await assert.rejects(SettingsDB.get('ws-a'),/broken/);
  const updated=await SettingsDB.update({accessToken:'replacement',appSecret:'new-secret'},'ws-a');
  assert.equal(updated.accessToken,'replacement');assert.equal(updated.appSecret,'new-secret');
});
test('phone ownership preflight rejects cross-tenant connection before any mutation', async () => {
  const b=backend(); b.tables.workspaces.push({id:'ws-a',name:'A'}); b.tables.phone_numbers.push({workspace_id:'ws-b',phone_number_id:'123'});
  const { SettingsDB }=load('src/lib/db/settings.ts',{'./client':b.client,'@/lib/crypto':{decryptToken:v=>v,encryptToken:v=>v}});
  await assert.rejects(SettingsDB.update({name:'Changed',phoneNumberId:'123'},'ws-a'),/another workspace/);
  assert.equal(b.tables.workspaces[0].name,'A'); assert.equal(b.tables.meta_connections.length,0);
});
test('public diagnostics reject anonymous and non-admin requests', async () => {
  for(const [user,status] of [[null,401],[{role:'agent',workspaceId:'ws-a'},403]]){
    const route=load('src/app/api/diagnostics/webhook/route.ts',{'next/server':{NextResponse},'@/lib/auth-server':{getAuthorizedUser:async()=>user},'@/lib/db/client':{database(){throw Error('must not query');}}});
    assert.equal((await route.GET(new NextRequest('https://example.test/api/diagnostics/webhook'))).status,status);
  }
});
test('deletion requests persist pending status and public lookup does not expose identity', async () => {
  const b=backend();b.tables.data_deletions=[];
  const repo=()=>load('src/lib/db/deletions.ts',{'./client':b.client});
  const row=await repo().DataDeletionDB.create({userId:'sensitive-id',email:'private@example.test',details:'private details'});
  assert.equal(row.status,'pending');
  const publicRow=await repo().DataDeletionDB.getByCode(row.confirmationCode);
  assert.equal(publicRow.userId,undefined);assert.equal(publicRow.email,undefined);assert.equal(publicRow.completedAt,null);
});
test('custom workflow validation rejects broken edges and duplicate nodes', () => {
  const { workflowValidationError: validate }=load('src/lib/automations/validateWorkflow.ts');
  assert.equal(validate({nodes:[{id:'t',type:'trigger_keyword'},{id:'e',type:'end'}],edges:[{source:'t',target:'e'}]}),null);
  assert.match(validate({nodes:[{id:'t',type:'trigger_keyword'}],edges:[{source:'t',target:'missing'}]}),/existing nodes/);
  assert.match(validate({nodes:[{id:'t',type:'trigger_keyword'},{id:'t',type:'end'}]}),/unique/);
});
test('sandbox waiting sessions cannot replace, resume or clear live sessions for the same recipient', async () => {
 const b=backend(); const repo=()=>load('src/lib/db/workflows.ts',{'./client':b.client});
 const now=new Date().toISOString(); const session={workspaceId:'ws-a',phoneNumber:'+15550001111',workflowId:'wf-a',executionId:'e-a',currentNodeId:'button',waitingFor:'button_click',variables:{},pausedAt:now,expiresAt:new Date(Date.now()+60000).toISOString()};
 await repo().WorkflowSessionsDB.save({...session,id:'live'});
 await repo().WorkflowSessionsDB.save({...session,id:'sandbox',isTestSimulation:true});
 assert.equal((await repo().WorkflowSessionsDB.get(session.phoneNumber,'ws-a')).id,'live');
 assert.equal((await repo().WorkflowSessionsDB.get(session.phoneNumber,'ws-a',true)).id,'sandbox');
 await repo().WorkflowSessionsDB.delete(session.phoneNumber,'ws-a','sandbox',true);
 assert.equal((await repo().WorkflowSessionsDB.get(session.phoneNumber,'ws-a')).id,'live');
});
test('lead ingestion persists UUID and executes configured DAG lead workflow in the same workspace', async()=>{
 const b=backend();b.tables.leads=[];const contexts=[];
 const {LeadCapturePipeline}=load('src/lib/leads/leadPipeline.ts',{
  '@/lib/db/client':b.client,'@/lib/db':{DEFAULT_WORKSPACE_ID:'default',ContactsDB:{upsert:async()=>({id:'contact-a'})},ConversationsDB:{recordOutbound:async()=>({id:'conversation-a'})}},
  '@/lib/automations/advancedWorkflowEngine':{AdvancedWorkflowEngine:{matchWorkflows:async(type,payload,ws)=>{assert.equal(type,'meta_lead_form');assert.equal(ws,'ws-a');return [{id:'wf-a'}];},executeWorkflow:async(wf,context)=>{contexts.push(context);return {status:'completed',steps:[]};}}},
  '@/lib/followup/followupEngine':{},'@/lib/supabase/server':{},
 });
 const result=await LeadCapturePipeline.ingest({workspaceId:'ws-a',source:'manual',phoneNumber:'15550001111'});
 assert.equal(result.success,true);assert.match(result.leadId,/^[a-f0-9-]{36}$/);assert.equal(b.tables.leads[0].workspace_id,'ws-a');assert.equal(contexts[0].workspaceId,'ws-a');assert.equal(result.initialMessageSent,false);
});
test('lead insertion failure is visible and does not send or schedule guessed messages',async()=>{
 const {LeadCapturePipeline}=load('src/lib/leads/leadPipeline.ts',{
  '@/lib/db/client':{database:()=>({from:()=>({insert:async()=>({error:{message:'insert failed'}})})}),checked(result){throw Error(result.error.message);}},
  '@/lib/db':{DEFAULT_WORKSPACE_ID:'default',ContactsDB:{upsert:async()=>({id:'contact-a'})},ConversationsDB:{recordOutbound:async()=>{throw Error('must not run');}}},
  '@/lib/automations/advancedWorkflowEngine':{},'@/lib/followup/followupEngine':{},'@/lib/supabase/server':{},
 });
 const result=await LeadCapturePipeline.ingest({workspaceId:'ws-a',source:'manual',phoneNumber:'15550001111'});assert.equal(result.success,false);assert.equal(result.error,'insert failed');
});
