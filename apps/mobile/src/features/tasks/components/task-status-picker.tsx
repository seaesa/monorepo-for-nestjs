import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { taskStatuses, type TaskStatus } from '@repo/contracts';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface TaskStatusPickerProps {
  value: TaskStatus | undefined;
  onChange: (status: TaskStatus | undefined) => void;
  /** Adds an "All" option that maps to `undefined` (used as a list filter). */
  allowAll?: boolean;
  disabled?: boolean;
}

export function TaskStatusPicker({ value, onChange, allowAll, disabled }: TaskStatusPickerProps) {
  const { t } = useTranslation('tasks');
  const options = allowAll ? [undefined, ...taskStatuses] : taskStatuses;

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((status) => (
        <Button
          key={status ?? 'all'}
          size="sm"
          variant={status === value ? 'default' : 'outline'}
          disabled={disabled}
          onPress={() => onChange(status)}
        >
          <Text>{status ? t(`statuses.${status}`) : t('filters.all')}</Text>
        </Button>
      ))}
    </View>
  );
}
