import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { formatDateTime } from '@repo/client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

interface DueDateFieldProps {
  /** ISO instant, as the contract expects. */
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

/** Android has no combined date-time dialog, so it asks for the date, then the time. */
function pickOnAndroid(initial: Date, onPicked: (date: Date) => void) {
  DateTimePickerAndroid.open({
    value: initial,
    mode: 'date',
    onChange: (event, date) => {
      if (event.type !== 'set' || !date) return;
      DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        onChange: (timeEvent, dateTime) => {
          if (timeEvent.type === 'set' && dateTime) onPicked(dateTime);
        },
      });
    },
  });
}

export function DueDateField({ value, onChange }: DueDateFieldProps) {
  const { t } = useTranslation('tasks');
  const date = value ? new Date(value) : null;

  return (
    <View className="gap-1.5">
      <Label>{t('fields.dueAt')}</Label>
      {Platform.OS === 'ios' && date ? (
        <DateTimePicker
          value={date}
          mode="datetime"
          onChange={(_, next) => next && onChange(next.toISOString())}
        />
      ) : (
        <Button
          variant="outline"
          onPress={() =>
            Platform.OS === 'android'
              ? pickOnAndroid(date ?? new Date(), (next) => onChange(next.toISOString()))
              : onChange(new Date().toISOString())
          }
        >
          <Text>{date ? formatDateTime(date.toISOString()) : t('fields.dueAt')}</Text>
        </Button>
      )}
      {date && (
        <Button variant="ghost" size="sm" onPress={() => onChange(null)}>
          <Text>{t('actions.delete', { ns: 'common' })}</Text>
        </Button>
      )}
    </View>
  );
}
