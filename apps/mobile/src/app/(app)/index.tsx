import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TaskList } from '@/features/tasks/components/task-list';

function HeaderActions() {
  const { t } = useTranslation();
  return (
    <View className="flex-row gap-1">
      <Link href="/settings" asChild>
        <Button variant="ghost" size="sm">
          <Text>{t('settings.title')}</Text>
        </Button>
      </Link>
      <Link href="/tasks/new" asChild>
        <Button size="sm">
          <Text>{t('new', { ns: 'tasks' })}</Text>
        </Button>
      </Link>
    </View>
  );
}

export default function TasksScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: HeaderActions,
        }}
      />
      <TaskList />
    </>
  );
}
