import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';

import { fromNow, useTasksQuery } from '@repo/client';
import type { Task, TaskStatus } from '@repo/contracts';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

import { TaskStatusPicker } from './task-status-picker';

function TaskRow({ task }: { task: Task }) {
  const { t } = useTranslation('tasks');
  return (
    <Link href={`/tasks/${task.id}`} asChild>
      <Pressable className="gap-1 border-b border-border px-6 py-3 active:bg-accent">
        <Text className={cn(task.status === 'DONE' && 'text-muted-foreground line-through')}>
          {task.title}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {t(`statuses.${task.status}`)}
          {task.dueAt ? ` · ${fromNow(task.dueAt)}` : ''}
        </Text>
      </Pressable>
    </Link>
  );
}

export function TaskList() {
  const { t } = useTranslation('tasks');
  const [status, setStatus] = useState<TaskStatus>();
  const tasks = useTasksQuery({ status });

  return (
    <FlatList
      className="flex-1 bg-background"
      data={tasks.data?.items ?? []}
      keyExtractor={(task) => task.id}
      renderItem={({ item }) => <TaskRow task={item} />}
      refreshing={tasks.isRefetching}
      onRefresh={() => void tasks.refetch()}
      ListHeaderComponent={
        <View className="p-6 pb-3">
          <TaskStatusPicker allowAll value={status} onChange={setStatus} />
        </View>
      }
      ListEmptyComponent={
        tasks.isPending ? (
          <ActivityIndicator className="p-6" />
        ) : (
          <Text className="p-6 text-center text-muted-foreground">{t('empty')}</Text>
        )
      }
    />
  );
}
