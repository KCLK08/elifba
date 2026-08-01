import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { computeParentDashboardStats } from '@/adaptive';
import { Avatar, Button, Card, ScreenContainer } from '@/components/ui';
import { useAdaptiveStore } from '@/store/adaptiveStore';
import { useProfileStore } from '@/store/profileStore';

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-base text-ink-muted">{label}</Text>
      <Text className="text-lg font-bold text-ink">{value}</Text>
    </View>
  );
}

function StatusPill({
  emoji,
  label,
  count,
  colorClass,
}: {
  emoji: string;
  label: string;
  count: number;
  colorClass: string;
}) {
  return (
    <View className={`flex-1 rounded-2xl px-3 py-4 ${colorClass}`}>
      <Text className="text-2xl">{emoji}</Text>
      <Text className="mt-2 text-sm font-semibold text-ink">{label}</Text>
      <Text className="mt-1 text-2xl font-bold text-ink">{count}</Text>
    </View>
  );
}

export function ParentDashboardScreen() {
  const router = useRouter();
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId ?? profiles[0]?.id ?? '');
  const byCard = useAdaptiveStore((s) => s.byCard);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;

  const stats = useMemo(
    () => (selectedProfileId ? computeParentDashboardStats(selectedProfileId, byCard) : null),
    [selectedProfileId, byCard],
  );

  if (!profiles.length) {
    return (
      <ScreenContainer>
        <Text className="mb-4 text-xl font-bold text-ink">Elternbereich</Text>
        <Text className="mb-6 text-base text-ink-muted">Noch kein Kinderprofil vorhanden.</Text>
        <Button label="Kind anlegen" onPress={() => router.push('/onboarding')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text className="mb-1 text-sm font-semibold text-primary">Elternbereich</Text>
      <Text className="mb-2 text-[28px] font-bold text-ink">Lernfortschritt</Text>
      <Text className="mb-6 text-base text-ink-muted">
        Übersicht ohne Karteninhalte — nur Statistik und Lernstatus.
      </Text>

      <Card className="mb-4">
        <Text className="mb-3 text-base font-semibold text-ink">Kind auswählen</Text>
        <View className="gap-2">
          {profiles.map((profile) => {
            const selected = profile.id === selectedProfileId;
            return (
              <Pressable
                key={profile.id}
                onPress={() => setSelectedProfileId(profile.id)}
                className={`flex-row items-center rounded-2xl px-3 py-3 ${
                  selected ? 'bg-primary-soft' : 'bg-background'
                }`}
              >
                <Avatar avatar={profile.avatar} size="sm" />
                <Text className="ml-3 flex-1 text-lg font-bold text-ink">{profile.name}</Text>
                {selected ? (
                  <Text className="text-sm font-semibold text-primary">Ausgewählt</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      {selectedProfile && stats ? (
        <>
          <Card className="mb-4">
            <Text className="mb-3 text-lg font-bold text-ink">
              {selectedProfile.name} — Übersicht
            </Text>
            <StatRow label="Bearbeitete Karten" value={stats.attemptedCards} />
            <StatRow label="Abgeschlossene Karten" value={stats.completedCards} />
            <StatRow label="In Bearbeitung" value={stats.inProgressCards} />
            <StatRow label="Noch zu lernen" value={stats.stillToLearn} />
          </Card>

          <Card className="mb-4">
            <Text className="mb-2 text-lg font-bold text-ink">📖 Noch zu lernen</Text>
            <Text className="text-base text-ink-muted">
              {stats.stillToLearn} Karten benötigen noch Übung
            </Text>
            <Text className="mt-2 text-sm text-ink-muted">
              Basierend auf Schwächewert, Fehlern und Lernfortschritt — ohne Anzeige einzelner
              Karten.
            </Text>
            <View className="mt-4">
              <Button
                label="⭐ Übung erstellen"
                onPress={() =>
                  router.push({
                    pathname: '/parent/exercise-preview',
                    params: { profileId: selectedProfileId },
                  })
                }
              />
            </View>
          </Card>

          <Card className="mb-4">
            <Text className="mb-3 text-lg font-bold text-ink">Allgemeiner Fortschritt</Text>
            <StatRow label="Bearbeitete Karten" value={stats.attemptedCards} />
            <StatRow label="Abgeschlossene Karten" value={stats.completedCards} />
            <StatRow label="In Bearbeitung" value={stats.inProgressCards} />
            <StatRow
              label="Mit Wiederholungsbedarf"
              value={stats.statusCounts.repeat + stats.statusCounts.practice}
            />
          </Card>

          <Card className="mb-4">
            <Text className="mb-3 text-lg font-bold text-ink">Lernentwicklung</Text>
            <Text className="mb-2 text-sm font-semibold text-ink-muted">Letzte 7 Tage</Text>
            <StatRow label="Übungseinheiten (geschätzt)" value={stats.weekly.practiceSessions} />
            <StatRow label="Aktive Lerntage" value={stats.weekly.activeDays} />
            <StatRow label="Richtige Antworten" value={`${stats.weekly.correctPercent} %`} />
            <StatRow label="Antworten gesamt" value={stats.weekly.totalAnswers} />
          </Card>

          <Card className="mb-4">
            <Text className="mb-3 text-lg font-bold text-ink">Kartenstatus</Text>
            <View className="flex-row gap-2">
              <StatusPill
                emoji="🟢"
                label="Sicher gelernt"
                count={stats.statusCounts.secure}
                colorClass="bg-success-soft"
              />
              <StatusPill
                emoji="🟡"
                label="Weiter üben"
                count={stats.statusCounts.practice}
                colorClass="bg-secondary-soft"
              />
              <StatusPill
                emoji="🔴"
                label="Wiederholung"
                count={stats.statusCounts.repeat}
                colorClass="bg-error-soft"
              />
            </View>
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}
