import { checked, database } from './client';

const BUCKET = 'workspace-media';

const mapAsset = (row: any) => row ? ({
  id: row.id,
  workspaceId: row.workspace_id,
  metaMediaId: row.meta_media_id || undefined,
  fileName: row.file_name,
  fileSize: Number(row.file_size_bytes || 0),
  mimeType: row.mime_type,
  storagePath: row.storage_path,
}) : null;

export const MediaAssetsDB = {
  async get(id: string, workspaceId: string) {
    const row = checked(await database().from('media_assets').select('*').eq('id', id).eq('workspace_id', workspaceId).maybeSingle());
    return mapAsset(row);
  },

  async download(id: string, workspaceId: string) {
    const asset = await this.get(id, workspaceId);
    if (!asset) return null;
    const downloaded = await database().storage.from(BUCKET).download(asset.storagePath);
    if (downloaded.error || !downloaded.data) throw new Error('Stored media could not be read.');
    return { ...asset, buffer: Buffer.from(await downloaded.data.arrayBuffer()) };
  },

  async setMetaMediaId(id: string, workspaceId: string, metaMediaId: string) {
    checked(await database().from('media_assets').update({ meta_media_id: metaMediaId }).eq('id', id).eq('workspace_id', workspaceId));
  },
};
