'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6 text-xs text-[#64748B]">
      Redirecting to secure login...
    </div>
  );
}
