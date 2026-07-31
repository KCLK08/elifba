import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { buildPersonalizedExercise } from '@/adaptive';
import { Button, Card, ScreenContainer } from '@/components/ui';
import { useAdaptiveStore } from '@/store/adaptiveStore';
import { useProfileStore } from '@/store/profileStore';

export function PersonalizedExercisePreviewScreen() {
  const router = useRouter();
  const { profileId: paramProfileId } = useLocalSearchParams<{ profileId?: string }>();
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const profiles = useProfileStore((s) => s.profiles);
  const byCard = useAdaptiveStore((s) => s.byCard);
  const setPersonalizedSession = useAdaptiveStore((s) => s.setPersonalizedSession);

  const profileId = paramProfileId ?? activeProfileId ?? '';
  const profile = profiles.find((p) => p.id === profileId);

  const built = useMemo(
    () => (profileId ? buildPersonalizedExercise(profileId, byCard) : null),
    [profileId, byCard],
  );

  if (!profile) {
    return (
      <ScreenContainer>
        <Text className="text-lg text-ink">Profil nicht gefunden.</Text>
      </ScreenContainer>
    );
  }

  if (!built) {
    return (
      <>
        <Stack.Screen options={{ title: 'Persönliche Wiederholung' }} />
        <ScreenContainer>
          <Text className="mb-4 text-xl font-bold text-ink">Noch keine Übung möglich</Text>
          <Text className="mb-8 text-base text-ink-muted">
            {profile.name} hat noch zu wenig Lerndaten. Bitte zuerst in den normalen Lektionen üben.
          </Text>
          <Button label="Zurück" variant="ghost" onPress={() => router.back()} />
        </ScreenContainer>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Persönliche Wiederholung' }} />
      <ScreenContainer>
        <Text className="mb-2 text-sm font-semibold text-primary">Für {profile.name}</Text>
        <Text className="mb-4 text-[28px] font-bold text-ink">Persönliche Wiederholung</Text>

        <Card className="mb-6">
          <Text className="mb-3 text-base text-ink-muted">
            Diese Übung wurde automatisch erstellt.
          </Text>
          <Text className="mb-2 text-base font-semibold text-ink">Enthalten:</Text>
          <Text className="text-base text-ink-muted">• Karten mit Lernbedarf ({built.needCards})</Text>
          <Text className="text-base text-ink-muted">
            • Karten zur Festigung ({built.secureCards})
          </Text>
          <Text className="mt-3 text-sm text-ink-muted">
            Insgesamt {built.refs.length} Karten — keine einzelnen Inhalte werden angezeigt.
          </Text>
        </Card>

        <Button
          label="Übung starten"
          onPress={() => {
            setPersonalizedSession(profileId, {
              refs: built.refs,
              needCards: built.needCards,
              secureCards: built.secureCards,
            });
            router.push({
              pathname: '/exercise/adaptive-personalized',
              params: { profileId },
            });
          }}
        />
        <View className="mt-3">
          <Button label="Abbrechen" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    </>
  );
}
