import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  contract,
  type CreateTaskInput,
  type ListTasksQuery,
  type TaskChangedEvent,
  type UpdateTaskInput,
} from '@repo/contracts';

import { request } from '../../http/client';
import { useSocketEvent } from '../../socket/socket';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (query: ListTasksQuery) => [...taskKeys.lists(), query] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

export const tasksQuery = (query: ListTasksQuery = {}) =>
  queryOptions({
    queryKey: taskKeys.list(query),
    queryFn: () => request(contract.tasks.list, { query }),
    placeholderData: keepPreviousData,
  });

export const taskQuery = (id: string) =>
  queryOptions({
    queryKey: taskKeys.detail(id),
    queryFn: () => request(contract.tasks.get, { params: { id } }),
  });

export const useTasksQuery = (query?: ListTasksQuery) => useQuery(tasksQuery(query));
export const useTaskQuery = (id: string) => useQuery(taskQuery(id));

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: CreateTaskInput) => request(contract.tasks.create, { body }),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      return queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useUpdateTaskMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (body: UpdateTaskInput) => request(contract.tasks.update, { params: { id }, body }),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(id), task);
      return queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(contract.tasks.remove, { params: { id } }),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/** Keeps the cache in step with changes made from the user's other devices. Mount once. */
export function useTasksRealtime(): void {
  const queryClient = useQueryClient();
  useSocketEvent('task.changed', (event: TaskChangedEvent) => {
    if (event.type === 'upserted') {
      queryClient.setQueryData(taskKeys.detail(event.task.id), event.task);
    } else {
      queryClient.removeQueries({ queryKey: taskKeys.detail(event.id) });
    }
    void queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  });
}
