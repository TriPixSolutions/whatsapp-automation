'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CrmRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/leads');
  }, [router]);

  return null;
}
