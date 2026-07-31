import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { WEAKNESS_EXERCISE_ID } from '@/adaptive';
import { Button, Card } from '@/components/ui';
import { useAdaptiveStore } from '@/store/adaptiveStore';
import { useProfileStore } from '@/store/profileStore';

function levelLabel(level: string): string {
  switch (level) {
    case 'stabil':
      return 'Stabil';
    case 'beobachten':
      return 'Beobachten';
    case 'schwäche':
      return 'Schwäche';
    default:
      return 'Zu wenig Daten';
  }
}

export function LearningAnalysisCard() {
  const router = useRouter();
  const profileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const summary = useAdaptiveStore((s) => s.getProfileSummary(profileId));
  const weakCards = useAdaptiveStore((s) => s.getWeakCards(profileId, 5));

  const learningNeedCount = summary.observeCards + summary.weaknessCards;

  return (
    <Card className="mb-4">
      <Text className="mb-1 text-lg font-bold text-ink">Lernanalyse</Text>
      <Text className="mb-4 text-sm text-ink-muted">
        Das System beobachtet deine Antworten im Hintergrund und erkennt, wo Wiederholung hilft.
      </Text>

      <View className="mb-4 gap-2">
        <Text className="text-base text-ink-muted">
          Bearbeitete Karten: {summary.attemptedCards}
        </Text>
        <Text className="text-base text-ink-muted">
          Abgeschlossene Karten: {summary.completedCards}
        </Text>
        <Text className="text-base text-ink-muted">Sichere Karten: {summary.stableCards}</Text>
        <Text className="text-base text-ink-muted">Mit Lernbedarf: {learningNeedCount}</Text>
        <Text className="text-base text-ink-muted">
          Aktiv diese Woche: {summary.recentAttempts} Karten
        </Text>
      </View>

      {weakCards.length > 0 ? (
        <View className="mb-4 gap-3">
          <Text className="text-base font-semibold text-ink">Schwächen</Text>
          {weakCards.map((entry) => (
            <View key={`${entry.stats.exerciseId}::${entry.stats.cardId}`} className="rounded-2xl bg-primary-soft px-3 py-3">
              <Text className="text-2xl font-bold text-ink">{entry.arabic}</Text>
              <Text className="mt-1 text-sm text-ink-muted">{entry.exerciseTitle}</Text>
              <Text className="mt-1 text-sm text-ink-muted">
                Schwächewert: {entry.effectiveWeakness} · {levelLabel(entry.level)} · ✓{' '}
                {entry.stats.correctCount} · ✗ {entry.stats.incorrectCount}
              </Text>
              {entry.stats.lastIncorrectAt ? (
                <Text className="text-xs text-ink-muted">
                  Letzter Fehler:{' '}
                  {new Date(entry.stats.lastIncorrectAt).toLocaleDateString('de-DE')}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text className="mb-4 text-sm text-ink-muted">
          Noch keine Schwächen erkannt — weiter üben in den Lektionen.
        </Text>
      )}

      <View className="gap-3">
        <Button
          label="Meine Schwächen üben"
          onPress={() => router.push(`/exercise/${WEAKNESS_EXERCISE_ID}`)}
        />
        <Button
          label="Schwächen abfragen"
          variant="secondary"
          onPress={() => router.push(`/exercise/${WEAKNESS_EXERCISE_ID}`)}
        />
      </View>
    </Card>
  );
}
