import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { formatCoordinates } from '@repo/client';
import type { GeoPoint } from '@repo/contracts';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useCurrentLocation } from '@/device/location/use-current-location';

interface LocationFieldProps {
  value: GeoPoint | null | undefined;
  onChange: (value: GeoPoint | null) => void;
}

export function LocationField({ value, onChange }: LocationFieldProps) {
  const { t } = useTranslation('tasks');
  const location = useCurrentLocation();

  return (
    <View className="gap-1.5">
      <Label>{t('fields.location')}</Label>
      {value ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{formatCoordinates(value)}</Text>
          <Button variant="ghost" size="sm" onPress={() => onChange(null)}>
            <Text>{t('location.remove')}</Text>
          </Button>
        </View>
      ) : (
        <Button
          variant="outline"
          disabled={location.status === 'locating'}
          onPress={() => void location.locate().then((point) => point && onChange(point))}
        >
          <Text>{t('location.attach')}</Text>
        </Button>
      )}
      {location.status === 'denied' && (
        <Text className="text-sm text-destructive">{t('location.denied')}</Text>
      )}
    </View>
  );
}
