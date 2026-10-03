'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { FileText, Image as ImageIcon, Loader2, Trash2, Upload, Video } from 'lucide-react';

type Asset = { id: string; fileName: string; fileSize: number; mimeType: string; providerReady: boolean; createdAt: string; previewUrl: string };

const formatBytes = (size: number) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;

export default function MediaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/media', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Media could not be loaded.');
      setAssets(Array.isArray(body) ? body : []);
    } catch (cause: any) {
      setError(cause.message || 'Media could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.set('file', file);
      const response = await fetch('/api/media', { method: 'POST', body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Upload failed.');
      await load();
    } catch (cause: any) {
      setError(cause.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (asset: Asset) => {
    if (!window.confirm(`Delete ${asset.fileName}? Workflows using it will need another file.`)) return;
    setError('');
    const response = await fetch(`/api/media?id=${encodeURIComponent(asset.id)}`, { method: 'DELETE' });
    const body = await response.json();
    if (!response.ok) return setError(body.error || 'Delete failed.');
    setAssets((current) => current.filter((item) => item.id !== asset.id));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pl-60">
      <Sidebar />
      <Header title="Media" subtitle="Upload once, then reuse files in WhatsApp automation messages" />
      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-950">Workspace media</h2>
            <p className="mt-1 text-sm text-slate-500">Images, MP4 video, MP3/OGG audio, and PDF files up to 16 MB.</p>
          </div>
          <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/ogg,application/pdf" onChange={(event) => upload(event.target.files?.[0])} />
          <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload file'}
          </button>
        </section>

        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : assets.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <ImageIcon className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-3 font-bold text-slate-900">No media uploaded</h2>
            <p className="mt-1 text-sm text-slate-500">Upload a file here or directly from a media step in the automation builder.</p>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const Icon = asset.mimeType.startsWith('image/') ? ImageIcon : asset.mimeType.startsWith('video/') ? Video : FileText;
              return <article key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex h-36 items-center justify-center bg-slate-100">
                  {asset.mimeType.startsWith('image/') ? <img src={asset.previewUrl} alt="" className="h-full w-full object-cover" /> : <Icon className="h-10 w-10 text-slate-400" />}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{asset.fileName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatBytes(asset.fileSize)} · {new Date(asset.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button type="button" onClick={() => remove(asset)} title="Delete file" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{asset.providerReady ? 'Uploaded to Meta and ready for reuse' : 'Stored privately; Meta upload happens on first live send'}</p>
                </div>
              </article>;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
