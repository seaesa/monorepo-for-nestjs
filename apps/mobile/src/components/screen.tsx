import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils';

/** Matches `px-6`; added to the safe-area insets, which classes cannot express. */
const EDGE_SPACING = 24;

/** Scrollable page body that respects the notch and home indicator. */
export function Screen({ className, children }: { className?: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-background"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName={cn('gap-6 px-6', className)}
      contentContainerStyle={{
        paddingTop: insets.top + EDGE_SPACING,
        paddingBottom: insets.bottom + EDGE_SPACING,
      }}
    >
      {children}
    </ScrollView>
  );
}
