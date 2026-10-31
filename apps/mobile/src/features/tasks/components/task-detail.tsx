import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import {
  formatCoordinates,
  formatDateTime,
  useDeleteTaskMutation,
  useTaskQuery,
  useUpdateTaskMutation,
} from '@repo/client';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { TaskStatusPicker } from './task-status-picker';

export function TaskDetail({ id }: { id: string }) {
  const { t } = useTranslation('tasks');
  const task = useTaskQuery(id);
  const update = useUpdateTaskMutation(id);
  const remove = useDeleteTaskMutation();

  if (!task.data) return <ActivityIndicator className="p-6" />;
  const { title, description, status, dueAt, location } = task.data;

  return (
    <View className="gap-6">
      <Stack.Screen options={{ title }} />
      {description && <Text>{description}</Text>}
      <TaskStatusPicker
        value={status}
        disabled={update.isPending}
        onChange={(next) => next && update.mutate({ status: next })}
      />
      {dueAt && (
        <Text className="text-muted-foreground">
          {t('fields.dueAt')}: {formatDateTime(dueAt)}
        </Text>
      )}
      {location && (
        <Text className="text-muted-foreground">
          {t('fields.location')}: {formatCoordinates(location)}
        </Text>
      )}
      <Button
        variant="destructive"
        disabled={remove.isPending}
        onPress={() => remove.mutate(id, { onSuccess: () => router.back() })}
      >
        <Text>{t('actions.delete', { ns: 'common' })}</Text>
      </Button>
    </View>
  );
}
