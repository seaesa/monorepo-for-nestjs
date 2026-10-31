'use client';

import { useTranslation } from 'react-i18next';

import { taskStatuses, type TaskStatus } from '@repo/contracts';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TaskStatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('tasks');
  const items = taskStatuses.map((status) => ({ value: status, label: t(`statuses.${status}`) }));
  return (
    <Select
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={(next) => next && onChange(next)}
    >
      <SelectTrigger size="sm" aria-label={t('fields.status')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
