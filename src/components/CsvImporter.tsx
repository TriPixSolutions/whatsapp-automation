'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, X, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CsvImporterProps {
  onImportSuccess?: (count: number) => void;
}

interface ParsedContact {
  phone_number: string;
  first_name?: string;
  last_name?: string;
  tags: string[];
}

export function CsvImporter({ onImportSuccess }: CsvImporterProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [defaultTag, setDefaultTag] = useState('teaser_list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setStatusMessage({ type: 'error', text: 'CSV must contain a header row and at least one contact.' });
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const phoneIdx = header.findIndex((h) => h.includes('phone') || h.includes('number') || h.includes('mobile'));
    const firstNameIdx = header.findIndex((h) => h.includes('first') || h.includes('name'));
    const lastNameIdx = header.findIndex((h) => h.includes('last'));
    const tagsIdx = header.findIndex((h) => h.includes('tag'));

    if (phoneIdx === -1) {
      setStatusMessage({ type: 'error', text: 'CSV must include a "phone" or "phone_number" column.' });
      return;
    }

    const contacts: ParsedContact[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((val) => val.trim().replace(/^["']|["']$/g, ''));
      const phone = row[phoneIdx];
      if (!phone) continue;

      let tags = defaultTag ? [defaultTag] : ['vip'];
      if (tagsIdx !== -1 && row[tagsIdx]) {
        const rowTags = row[tagsIdx].split(';').map((t) => t.trim().toLowerCase());
        tags = Array.from(new Set([...tags, ...rowTags]));
      }

      contacts.push({
        phone_number: phone.startsWith('+') ? phone : `+${phone}`,
        first_name: firstNameIdx !== -1 ? row[firstNameIdx] : 'VIP Client',
        last_name: lastNameIdx !== -1 ? row[lastNameIdx] : '',
        tags,
      });
    }

    setParsedContacts(contacts);
    setStatusMessage(null);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      setStatusMessage({ type: 'error', text: 'Please upload a valid .csv spreadsheet file.' });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const executeImport = async () => {
    if (parsedContacts.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: parsedContacts }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${data.count} high-ticket contacts into your audience!`,
        });
        onImportSuccess?.(data.count);
        setParsedContacts([]);
        setFileName(null);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to complete CSV import.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const sample = `phone_number,first_name,last_name,tags
+971509998877,Maximilian,Rothschild,vip;yachting
+447700900555,Countess Isabella,Montague,vip;fine-jewelry
+14155559812,Alexander,Sterling,vip;private-aviation`;
    setFileName('luxury_leads_sample.csv');
    parseCsvText(sample);
  };

  return (
    <div className="rounded-2xl bg-[#0B0F17]/90 border border-white/10 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E6C687]" />
            Bulk CSV Audience Ingestion
          </h3>
          <p className="text-xs text-zinc-400">
            Import high-net-worth contacts directly. Formats supported: E.164 international numbers.
          </p>
        </div>
        <button
          onClick={loadSampleData}
          type="button"
          className="text-xs font-mono text-[#E6C687] hover:underline bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20"
        >
          Insert Sample CSV
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3',
          dragOver
            ? 'border-[#D4AF37] bg-[#D4AF37]/5'
            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
          <UploadCloud className="w-6 h-6 text-[#E6C687]" />
        </div>
        <div>
          <p className="text-xs font-medium text-white">
            {fileName ? (
              <span className="text-[#E6C687] flex items-center justify-center gap-1">
                <FileText className="w-3.5 h-3.5" /> {fileName}
              </span>
            ) : (
              'Click to select or drag and drop luxury CSV file'
            )}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Columns required: phone_number, first_name, last_name, tags</p>
        </div>
      </div>

      {/* Default Tag Selector */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-zinc-400">Assign Tag to All Records:</span>
        <input
          type="text"
          value={defaultTag}
          onChange={(e) => setDefaultTag(e.target.value)}
          placeholder="e.g. teaser_list"
          className="bg-[#111622] border border-white/10 rounded-lg px-3 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37] font-mono"
        />
      </div>

      {/* Feedback Message */}
      {statusMessage && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-xs font-medium',
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Parsed Preview Table */}
      {parsedContacts.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">
              Verified Records Ready ({parsedContacts.length})
            </span>
            <button
              onClick={() => setParsedContacts([])}
              className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-[#07090E]">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/5 text-[10px] uppercase text-zinc-400 tracking-wider">
                <tr>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Phone (E.164)</th>
                  <th className="p-2.5">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {parsedContacts.slice(0, 5).map((c, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="p-2.5 font-sans text-white">{c.first_name} {c.last_name}</td>
                    <td className="p-2.5 text-[#E6C687]">{c.phone_number}</td>
                    <td className="p-2.5">
                      <div className="flex gap-1">
                        {c.tags.map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-zinc-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={executeImport}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50 shadow-gold-glow"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm & Import {parsedContacts.length} Contacts
          </button>
        </div>
      )}
    </div>
  );
}
