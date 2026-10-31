import './globals.css';

import type { Metadata } from 'next';
import { Figtree, Geist_Mono } from 'next/font/google';

import { Providers } from '@/components/providers';
import { getRequestLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

const fontSans = Figtree({ subsets: ['latin'], variable: '--font-sans' });
const fontMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: { default: 'Monorepo Starter', template: '%s · Monorepo Starter' },
  description: 'Next.js + NestJS + Expo, sharing one typed contract',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn('font-sans antialiased', fontSans.variable, fontMono.variable)}
    >
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
