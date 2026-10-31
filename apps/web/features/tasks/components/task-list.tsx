'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useTasksQuery, useTasksRealtime } from '@repo/client';
import { taskStatuses, type TaskStatus } from '@repo/contracts';

import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { TaskItem } from './task-item';

export function TaskList({ status }: { status?: TaskStatus }) {
  const { t } = useTranslation('tasks');
  useTasksRealtime();
  const { data, isPending } = useTasksQuery({ status });

  const filters = [undefined, ...taskStatuses].map((value) => ({
    value,
    href: value ? `/tasks?status=${value}` : '/tasks',
    label: value ? t(`statuses.${value}`) : t('filters.all'),
  }));

  return (
    <section className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-1">
        {filters.map((filter) => (
          <Link
            key={filter.href}
            href={filter.href}
            className={buttonVariants({
              variant: filter.value === status ? 'secondary' : 'ghost',
              size: 'sm',
            })}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      {isPending ? (
        <Skeleton className="h-24" />
      ) : data?.items.length ? (
        <ul className="divide-y divide-border border-y border-border">
          {data.items.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
      )}
    </section>
  );
}
