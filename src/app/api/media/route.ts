import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
import { database, checked } from '@/lib/db/client';
import { randomUUID, createHash } from 'crypto';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const bucket = 'workspace-media';
const allowed = new Set(['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg','audio/ogg','application/pdf']);
function matchesMime(b: Buffer, mime: string) {
  if (mime === 'image/jpeg') return b[0] === 255 && b[1] === 216 && b[2] === 255;
  if (mime === 'image/png') return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/webp') return b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP';
  if (mime === 'application/pdf') return b.toString('ascii',0,5) === '%PDF-';
  if (mime === 'video/mp4') return b.toString('ascii',4,8) === 'ftyp';
  if (mime === 'audio/ogg') return b.toString('ascii',0,4) === 'OggS';
  return b.toString('ascii',0,3) === 'ID3' || (b[0] === 255 && (b[1] & 224) === 224);
}
export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const file = (await request.formData()).get('file');
    if (!file || typeof file === 'string' || !allowed.has(file.type)) return NextResponse.json({error:'Unsupported file type'}, {status:400});
    if (!file.size || file.size > 16 * 1024 * 1024) return NextResponse.json({error:'File must be between 1 byte and 16 MB'}, {status:413});
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesMime(buffer,file.type)) return NextResponse.json({error:'File content does not match its declared type'}, {status:400});
    const db = database(), id = randomUUID(), storagePath = `${user.workspaceId}/${id}`;
    const stored = await db.storage.from(bucket).upload(storagePath,buffer,{contentType:file.type,upsert:false});
    if (stored.error) throw new Error('Persistent storage upload failed');
    try {
      checked(await db.from('media_assets').insert({ id,workspace_id:user.workspaceId,
        file_name:file.name.replace(/[\\/\x00-\x1f]/g,'_').slice(0,255),file_size_bytes:file.size,mime_type:file.type,
        sha256_hash:createHash('sha256').update(buffer).digest('hex'),storage_path:storagePath,public_url:`/api/media?id=${id}` }));
    } catch (error) {
      await db.storage.from(bucket).remove([storagePath]);
      throw error;
    }
    const signed = await db.storage.from(bucket).createSignedUrl(storagePath,3600);
    if (signed.error) throw new Error('Media retrieval link unavailable');
    return NextResponse.json({success:true,assetId:id,publicUrl:signed.data.signedUrl,mimeType:file.type,fileSize:file.size});
  } catch { return NextResponse.json({error:'Media upload failed. Check the storage bucket and database migration.'},{status:503}); }
}
export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({error:'Unauthorized'},{status:401});
  try {
    const db=database(),id=request.nextUrl.searchParams.get('id');
    if (id) {
      const row=checked(await db.from('media_assets').select('storage_path').eq('id',id).eq('workspace_id',user.workspaceId!).maybeSingle());
      if (!row) return NextResponse.json({error:'Media not found'},{status:404});
      const signed=await db.storage.from(bucket).createSignedUrl(row.storage_path,3600);
      if (signed.error) throw new Error('Unavailable');
      return NextResponse.redirect(signed.data.signedUrl);
    }
    const rows=checked(await db.from('media_assets').select('*').eq('workspace_id',user.workspaceId!).order('created_at',{ascending:false}).limit(100));
    return NextResponse.json(rows);
  } catch { return NextResponse.json({error:'Media unavailable'},{status:503}); }
}
export async function DELETE(request: NextRequest) {
  const user=await getAuthorizedUser(request);
  if (!user) return NextResponse.json({error:'Unauthorized'},{status:401});
  try {
    const id=request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({error:'Media ID required'},{status:400});
    const db=database(),row=checked(await db.from('media_assets').select('storage_path').eq('id',id).eq('workspace_id',user.workspaceId!).maybeSingle());
    if (!row) return NextResponse.json({error:'Media not found'},{status:404});
    const removed=await db.storage.from(bucket).remove([row.storage_path]);
    if (removed.error) throw new Error('Storage deletion failed');
    checked(await db.from('media_assets').delete().eq('id',id).eq('workspace_id',user.workspaceId!));
    return NextResponse.json({success:true});
  } catch { return NextResponse.json({error:'Media deletion failed'},{status:503}); }
}
