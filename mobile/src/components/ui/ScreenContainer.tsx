import { ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  /** When true (default), pad bottom for Android nav / home indicator. */
  padBottom?: boolean;
}

export function ScreenContainer({
  children,
  scroll = true,
  className,
  padBottom = true,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = padBottom ? Math.max(insets.bottom, 12) + 8 : 16;

  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomPad + 8 }}
      contentContainerClassName={className}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      className={`flex-1 px-5 pt-4 ${className ?? ''}`}
      style={{ paddingBottom: bottomPad }}
      {...props}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {body}
    </SafeAreaView>
  );
}
