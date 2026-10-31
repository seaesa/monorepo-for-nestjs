import { Controller, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

interface TextFieldProps<T extends FieldValues> extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChangeText' | 'onBlur'
> {
  form: UseFormReturn<T, unknown, unknown>;
  name: Path<T>;
  label: string;
}

/** Label + input + translated error, bound to a `useZodForm` form. */
export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  ...input
}: TextFieldProps<T>) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <View className="gap-1.5">
          <Label nativeID={name}>{label}</Label>
          <Input
            aria-labelledby={name}
            aria-invalid={Boolean(fieldState.error)}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            {...input}
          />
          {fieldState.error?.message && (
            <Text className="text-sm text-destructive">{fieldState.error.message}</Text>
          )}
        </View>
      )}
    />
  );
}
