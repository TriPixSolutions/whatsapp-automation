'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function StatusRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';

  useEffect(() => {
    if (code) {
      router.replace(`/data-deletion?code=${encodeURIComponent(code)}`);
    } else {
      router.replace('/data-deletion');
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-sm text-slate-500">
      Loading Data Deletion Status...
    </div>
  );
}

export default function DataDeletionStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-sm text-slate-500">Loading...</div>}>
      <StatusRedirectContent />
    </Suspense>
  );
}
