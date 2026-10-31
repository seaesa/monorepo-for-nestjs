import type { Metadata } from 'next';

import { taskStatusSchema } from '@repo/contracts';

import { TaskCreateForm } from '@/features/tasks/components/task-create-form';
import { TaskList } from '@/features/tasks/components/task-list';

export const metadata: Metadata = { title: 'Tasks' };

export default async function TasksPage({ searchParams }: PageProps<'/tasks'>) {
  const status = taskStatusSchema.safeParse((await searchParams).status).data;
  return (
    <div className="flex flex-col gap-8">
      <TaskCreateForm />
      <TaskList status={status} />
    </div>
  );
}
