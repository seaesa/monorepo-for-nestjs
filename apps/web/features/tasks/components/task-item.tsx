'use client';

import { useTranslation } from 'react-i18next';

import { fromNow, useDeleteTaskMutation, useUpdateTaskMutation } from '@repo/client';
import type { Task } from '@repo/contracts';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { TaskStatusSelect } from './task-status-select';

export function TaskItem({ task }: { task: Task }) {
  const { t } = useTranslation();
  const update = useUpdateTaskMutation(task.id);
  const remove = useDeleteTaskMutation();
  const done = task.status === 'DONE';

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className={cn('truncate', done && 'text-muted-foreground line-through')}>{task.title}</p>
        {task.dueAt && <p className="text-xs text-muted-foreground">{fromNow(task.dueAt)}</p>}
      </div>
      <TaskStatusSelect
        value={task.status}
        disabled={update.isPending}
        onChange={(status) => update.mutate({ status })}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={remove.isPending}
        onClick={() => remove.mutate(task.id)}
      >
        {t('actions.delete')}
      </Button>
    </li>
  );
}
