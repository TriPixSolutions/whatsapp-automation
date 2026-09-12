'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
      Redirecting to onboarding...
    </div>
  );
}
