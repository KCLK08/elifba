import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nicht gefunden' }} />
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="mb-4 text-center text-2xl font-bold text-ink">
          Diese Seite gibt es nicht.
        </Text>
        <Link href="/(tabs)/home" className="py-3">
          <Text className="text-lg font-bold text-primary">Zur Startseite</Text>
        </Link>
      </View>
    </>
  );
}
