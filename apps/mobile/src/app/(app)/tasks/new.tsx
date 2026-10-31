import { Screen } from '@/components/screen';
import { TaskCreateForm } from '@/features/tasks/components/task-create-form';

export default function NewTaskScreen() {
  return (
    <Screen>
      <TaskCreateForm />
    </Screen>
  );
}
