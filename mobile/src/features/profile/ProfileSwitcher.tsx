import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Avatar, Button, Card } from '@/components/ui';
import { useProfileStore } from '@/store/profileStore';

interface ProfileSwitcherProps {
  onAddProfile?: () => void;
}

export function ProfileSwitcher({ onAddProfile }: ProfileSwitcherProps) {
  const router = useRouter();
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);

  return (
    <Card className="mb-4">
      <Text className="mb-3 text-base font-semibold text-ink">Wer lernt?</Text>
      <View className="gap-3">
        {profiles.map((profile) => {
          const active = profile.id === activeProfileId;
          return (
            <View
              key={profile.id}
              className={`flex-row items-center rounded-2xl px-3 py-3 ${
                active ? 'bg-primary-soft' : 'bg-background'
              }`}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => void setActiveProfile(profile.id)}
                className="min-h-[48px] flex-1 flex-row items-center"
              >
                <Avatar avatar={profile.avatar} size="sm" />
                <Text className="ml-3 flex-1 text-lg font-bold text-ink">{profile.name}</Text>
                {active ? <Text className="text-sm font-semibold text-primary">Aktiv</Text> : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${profile.name} bearbeiten`}
                onPress={() => router.push(`/profile/${profile.id}`)}
                className="ml-2 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-card px-2"
              >
                <Text className="text-sm font-semibold text-primary">Bearbeiten</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      {onAddProfile ? (
        <View className="mt-4">
          <Button label="Neues Kind" variant="ghost" size="md" onPress={onAddProfile} />
        </View>
      ) : null}
    </Card>
  );
}
