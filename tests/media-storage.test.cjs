const {test}=require('node:test');const assert=require('node:assert/strict');const load=require('./load-ts.cjs');const backend=require('./fake-database.cjs');const {NextRequest,NextResponse}=require('next/server');
function harness(user={role:'owner',workspaceId:'ws-a'}){
 const b=backend();b.tables.media_assets=[];const uploads=[],removals=[];let failInsert=false;
 b.client.database().storage={from:()=>({upload:async(path,bytes)=>{uploads.push({path,bytes});return {error:null};},remove:async paths=>{removals.push(...paths);return {error:null};},createSignedUrl:async path=>({data:{signedUrl:`https://storage.example.test/${path}`},error:null})})};
 const client={...b.client,checked(result){if(failInsert)throw Error('metadata failed');return b.client.checked(result);}};
 const route=load('src/app/api/media/route.ts',{'next/server':{NextResponse},'@/lib/auth-server':{getAuthorizedUser:async()=>user},'@/lib/db/client':client});
 return {route,b,uploads,removals,failMetadata(){failInsert=true;}};
}
function upload(bytes,type='image/png') {const data=new FormData();data.set('file',new Blob([bytes],{type}),'photo.png');return new NextRequest('https://example.test/api/media',{method:'POST',body:data});}
const png=Buffer.from([137,80,78,71,13,10,26,10,0,0]);
test('media upload writes real bytes to persistent private storage and UUID metadata',async()=>{const h=harness();const response=await h.route.POST(upload(png));assert.equal(response.status,200);const body=await response.json();assert.match(body.assetId,/^[a-f0-9-]{36}$/);assert.equal(h.uploads[0].bytes.equals(png),true);assert.equal(h.b.tables.media_assets[0].workspace_id,'ws-a');assert.equal(body.metaMediaId,undefined);});
test('media rejects spoofed content and unsupported MIME before storage',async()=>{const h=harness();assert.equal((await h.route.POST(upload('not a png'))).status,400);assert.equal((await h.route.POST(upload('html','text/html'))).status,400);assert.equal(h.uploads.length,0);});
test('failed metadata write rolls storage upload back and never reports success',async()=>{const h=harness();h.failMetadata();assert.equal((await h.route.POST(upload(png))).status,503);assert.equal(h.removals.length,1);});
test('media lookup and delete cannot access another workspace asset',async()=>{const h=harness();h.b.tables.media_assets.push({id:'other',workspace_id:'ws-b',storage_path:'ws-b/secret'});assert.equal((await h.route.GET(new NextRequest('https://example.test/api/media?id=other'))).status,404);assert.equal((await h.route.DELETE(new NextRequest('https://example.test/api/media?id=other',{method:'DELETE'}))).status,404);assert.equal(h.removals.length,0);});
test('anonymous media requests are rejected without storage access',async()=>{const h=harness(null);assert.equal((await h.route.POST(upload(png))).status,401);assert.equal(h.uploads.length,0);});
