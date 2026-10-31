import Link from 'next/link';

import { SessionGate } from '@/features/auth/components/session-gate';
import { AppNav } from '@/features/settings/components/app-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGate require="signedIn" redirectTo="/login">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/tasks" className="font-semibold">
            Monorepo Starter
          </Link>
          <AppNav />
        </header>
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </SessionGate>
  );
}
