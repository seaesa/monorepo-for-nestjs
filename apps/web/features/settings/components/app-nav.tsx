'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';

export function AppNav() {
  const { t } = useTranslation();
  return (
    <nav className="flex gap-1">
      <Link href="/tasks" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        {t('title', { ns: 'tasks' })}
      </Link>
      <Link href="/settings" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        {t('settings.title')}
      </Link>
    </nav>
  );
}
