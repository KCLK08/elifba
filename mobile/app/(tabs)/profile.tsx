import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Avatar, Button, Card, ScreenContainer } from '@/components/ui';
import { ProfileSwitcher } from '@/features/profile';
import { RewardsStrip } from '@/features/rewards';
import { useProfileStore } from '@/store/profileStore';
import { EMPTY_REWARDS, useRewardsStore } from '@/store/rewardsStore';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => {
    const id = s.activeProfileId;
    return s.profiles.find((p) => p.id === id) ?? null;
  });
  const profileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const rewards = useRewardsStore((s) => s.byProfile[profileId] ?? EMPTY_REWARDS);

  return (
    <ScreenContainer>
      <View className="mb-6 items-center">
        {profile ? <Avatar avatar={profile.avatar} size="lg" /> : null}
        <Text className="mt-4 text-[28px] font-bold text-ink">{profile?.name ?? 'Profil'}</Text>
        <Text className="mt-1 text-base text-ink-muted">Dein Lernprofil</Text>
      </View>

      <RewardsStrip stars={rewards.stars} streak={rewards.streak} />

      {profile ? (
        <Button
          label="Profil bearbeiten"
          variant="ghost"
          size="md"
          className="mb-4"
          onPress={() => router.push(`/profile/${profile.id}`)}
        />
      ) : null}

      <ProfileSwitcher onAddProfile={() => router.push('/onboarding')} />

      <Card className="mb-4">
        <Text className="mb-2 text-base font-semibold text-ink">Für Eltern</Text>
        <Text className="mb-4 text-sm text-ink-muted">
          Lernstatistik und personalisierte Wiederholungsübungen — ohne Karteninhalte.
        </Text>
        <Button label="Elternbereich öffnen" variant="secondary" onPress={() => router.push('/parent')} />
      </Card>

      <Card className="mb-4">
        <Text className="mb-2 text-base text-ink-muted">
          Übungen geschafft: {rewards.exercisesCompleted}
        </Text>
        <Text className="mb-4 text-base text-ink-muted">
          Lektionen geschafft: {rewards.lessonsCompleted}
        </Text>
        <Button label="Einstellungen" variant="ghost" onPress={() => router.push('/settings')} />
      </Card>
    </ScreenContainer>
  );
}
