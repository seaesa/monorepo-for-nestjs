import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { TaskDetail } from '@/features/tasks/components/task-detail';

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <TaskDetail id={id} />
    </Screen>
  );
}
