import { Pressable, Text, View } from 'react-native';

import { Avatar, Button, Card } from '@/components/ui';
import { useProfileStore } from '@/store/profileStore';

interface ProfileSwitcherProps {
  onAddProfile?: () => void;
}

export function ProfileSwitcher({ onAddProfile }: ProfileSwitcherProps) {
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
            <Pressable
              key={profile.id}
              accessibilityRole="button"
              onPress={() => void setActiveProfile(profile.id)}
              className={`flex-row items-center rounded-2xl px-3 py-3 ${
                active ? 'bg-primary-soft' : 'bg-background'
              }`}
            >
              <Avatar avatar={profile.avatar} size="sm" />
              <Text className="ml-3 flex-1 text-lg font-bold text-ink">{profile.name}</Text>
              {active ? <Text className="text-sm font-semibold text-primary">Aktiv</Text> : null}
            </Pressable>
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
