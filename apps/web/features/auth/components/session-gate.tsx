'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthStore } from '@repo/client';

import { Spinner } from '@/components/ui/spinner';

/**
 * Sessions live in httpOnly cookies the browser cannot read, so who is signed in is only known
 * after `restoreSession()` asks the API. Until then render a spinner, never the wrong screen.
 */
export function SessionGate({
  require,
  redirectTo,
  children,
}: {
  require: 'signedIn' | 'signedOut';
  redirectTo: string;
  children: React.ReactNode;
}) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const allowed = status === require;

  useEffect(() => {
    if (status !== 'unknown' && !allowed) router.replace(redirectTo);
  }, [status, allowed, router, redirectTo]);

  if (!allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }
  return children;
}
