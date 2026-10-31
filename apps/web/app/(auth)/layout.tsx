import { SessionGate } from '@/features/auth/components/session-gate';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGate require="signedOut" redirectTo="/tasks">
      <main className="flex min-h-dvh items-center justify-center px-6">{children}</main>
    </SessionGate>
  );
}
