'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Routes that must stay reachable without a token — only /login itself.
// Everything else in the site requires login first (home included).
const PUBLIC_PATHS = ['/login'];

export default function AuthGate({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [checked, setChecked] = useState(isPublic);

  useEffect(() => {
    if (isPublic) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setChecked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isPublic]);

  // Blank instead of flashing gated content while we check/redirect.
  if (!isPublic && !checked) {
    return <div className="min-h-screen bg-bg" />;
  }

  return children;
}