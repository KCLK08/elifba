import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type TabIcon = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, color }: { name: TabIcon; color: string }) {
  return <Ionicons size={26} name={name} color={color} />;
}

function resolveTabColor(color: ColorValue): string {
  return typeof color === 'string' ? color : colors.inkMuted;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          backgroundColor: colors.card,
          borderTopColor: colors.primarySoft,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={resolveTabColor(color)} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Lernen',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={resolveTabColor(color)} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Fortschritt',
          tabBarIcon: ({ color }) => <TabBarIcon name="star" color={resolveTabColor(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={resolveTabColor(color)} />,
        }}
      />
    </Tabs>
  );
}
