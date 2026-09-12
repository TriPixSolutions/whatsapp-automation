'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/super-admin-control');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0D13] text-slate-400 text-xs font-mono">
      Redirecting to Super Admin Control Plane...
    </div>
  );
}
