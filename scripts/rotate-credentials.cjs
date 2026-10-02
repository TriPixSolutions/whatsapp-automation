// Run with OLD_ENCRYPTION_KEY and ENCRYPTION_KEY supplied securely by your host.
// Defaults to validation only. --apply writes an encrypted recovery snapshot first.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({path:path.resolve(__dirname,'../.env.local'),quiet:true});
const {createClient}=require('@supabase/supabase-js');
function transform(value, oldKey, newKey) {
  if(!value)return '';
  let plain=value;
  if(value.startsWith('enc:gcm:')){
    const parts=value.split(':');
    if(parts.length!==5 || !/^[a-f0-9]{24}$/i.test(parts[2]) || !/^[a-f0-9]{32}$/i.test(parts[3]) || !/^(?:[a-f0-9]{2})+$/i.test(parts[4]))throw Error('Malformed encrypted credential');
    const decipher=crypto.createDecipheriv('aes-256-gcm',crypto.createHash('sha256').update(oldKey).digest(),Buffer.from(parts[2],'hex'));
    decipher.setAuthTag(Buffer.from(parts[3],'hex'));
    plain=Buffer.concat([decipher.update(Buffer.from(parts[4],'hex')),decipher.final()]).toString('utf8');
  }
  const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',crypto.createHash('sha256').update(newKey).digest(),iv);
  const encrypted=Buffer.concat([cipher.update(plain,'utf8'),cipher.final()]);
  return `enc:gcm:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}
async function main(){
  const oldKey=process.env.OLD_ENCRYPTION_KEY,newKey=process.env.ENCRYPTION_KEY;
  if(!oldKey||!newKey||newKey.length<32)throw Error('Explicit old key and new key (at least 32 characters) required');
  const db=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  const {data,error}=await db.from('meta_connections').select('workspace_id,access_token_encrypted,app_secret_encrypted,updated_at');
  if(error)throw Error('Cannot read credential records');
  // Validate every record before any write; never guess an old key.
  const planned=data.map(row=>({row,changes:{access_token_encrypted:transform(row.access_token_encrypted,oldKey,newKey),app_secret_encrypted:transform(row.app_secret_encrypted,oldKey,newKey)}}));
  console.log(`Validated ${planned.length} connections. No secrets printed.`);
  if(!process.argv.includes('--apply')){console.log('Validation only. During maintenance, run with --apply and then restart all services with the new key.');return;}
  if(data.some(row=>[row.access_token_encrypted,row.app_secret_encrypted].some(v=>v&&!v.startsWith('enc:gcm:'))))throw Error('Legacy plaintext record found. Reconnect it before rotation so recovery snapshots contain encrypted values only.');
  const backup=path.resolve(process.env.CREDENTIAL_BACKUP_PATH||`credential-recovery-${Date.now()}.json`);
  fs.writeFileSync(backup,JSON.stringify(data),{mode:0o600,flag:'wx'});
  for(const {row,changes} of planned){
    let query=db.from('meta_connections').update(changes).eq('workspace_id',row.workspace_id);
    if(row.updated_at)query=query.eq('updated_at',row.updated_at);
    if(row.access_token_encrypted)query=query.eq('access_token_encrypted',row.access_token_encrypted);
    const result=await query.select('workspace_id');
    if(result.error||result.data.length!==1)throw Error('Rotation interrupted by a concurrent change. Use the encrypted recovery snapshot; do not switch service keys until reconciled.');
  }
  console.log('Rotation complete. Keep the recovery snapshot outside Git and restart services with the new key.');
}
module.exports={transform};
if(require.main===module)main().catch(()=>{console.error('Credential rotation failed. Check supplied keys, connectivity and encrypted recovery snapshot.');process.exitCode=1;});
