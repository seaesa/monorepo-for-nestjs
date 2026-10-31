import { VerifyEmail } from '@/features/auth/components/verify-email';

export default async function Page({ searchParams }: PageProps<'/verify-email'>) {
  const { token } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <VerifyEmail token={typeof token === 'string' ? token : ''} />
    </main>
  );
}
