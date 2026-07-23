import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Avatar, Button, Card, ScreenContainer } from '@/components/ui';
import { AVATAR_EMOJI, AVATAR_IDS } from '@/constants/avatars';
import { arabicTextStyle } from '@/features/learning/arabic/arabicDisplay';
import { useProfileStore } from '@/store/profileStore';
import type { AvatarId } from '@/types';

type Step = 'welcome' | 'explain' | 'profile';

export function OnboardingScreen() {
  const router = useRouter();
  const createProfile = useProfileStore((s) => s.createProfile);
  const profilesCount = useProfileStore((s) => s.profiles.length);
  const [step, setStep] = useState<Step>(profilesCount > 0 ? 'profile' : 'welcome');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>('fox');
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await createProfile({ name: name.trim() || 'Freund', avatar });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'welcome') {
    return (
      <ScreenContainer>
        <Text className="mb-2 text-center text-sm font-semibold text-primary">Elifba Kids</Text>
        <Text className="mb-4 text-center text-[34px] font-bold text-ink">Assalamu alaikum!</Text>
        <Text className="mb-8 text-center text-lg leading-7 text-ink-muted">
          Schön, dass du da bist. Hier lernst du die Buchstaben des Korans – mit Audio und ganz in
          deinem Tempo.
        </Text>
        <Card className="mb-8 bg-primary-soft" elevated={false}>
          <Text className="text-5xl" style={{ ...arabicTextStyle, direction: 'rtl' }}>
            ا ب ت
          </Text>
        </Card>
        <Button label="Weiter" onPress={() => setStep('explain')} />
      </ScreenContainer>
    );
  }

  if (step === 'explain') {
    return (
      <ScreenContainer>
        <Text className="mb-2 text-center text-[28px] font-bold text-ink">So funktioniert’s</Text>
        <Card className="mb-4">
          <Text className="mb-2 text-lg font-bold text-ink">1. Anhören</Text>
          <Text className="text-base text-ink-muted">Tippe auf das Lautsprecher-Symbol.</Text>
        </Card>
        <Card className="mb-4">
          <Text className="mb-2 text-lg font-bold text-ink">2. Üben</Text>
          <Text className="text-base text-ink-muted">
            Sag dir: Richtig, Unsicher oder Falsch – ganz ehrlich.
          </Text>
        </Card>
        <Card className="mb-8">
          <Text className="mb-2 text-lg font-bold text-ink">3. Sterne sammeln</Text>
          <Text className="text-base text-ink-muted">
            Wenn du fertig bist, bekommst du Sterne. Super!
          </Text>
        </Card>
        <Button label="Profil erstellen" onPress={() => setStep('profile')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text className="mb-2 text-center text-sm font-semibold text-primary">Fast geschafft</Text>
      <Text className="mb-2 text-center text-[32px] font-bold text-ink">Wer bist du?</Text>
      <Text className="mb-8 text-center text-base text-ink-muted">
        Wähle einen Namen und einen Freund. Du kannst später weitere Profile anlegen.
      </Text>

      <View className="mb-8 items-center">
        <Avatar avatar={avatar} size="lg" />
      </View>

      <Card className="mb-5">
        <Text className="mb-2 text-base font-semibold text-ink">Dein Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="z. B. Amina"
          placeholderTextColor="#99B8B4"
          maxLength={20}
          className="min-h-[56px] rounded-2xl bg-primary-soft px-4 text-xl font-bold text-ink"
          autoCapitalize="words"
          returnKeyType="done"
        />
      </Card>

      <Card className="mb-8">
        <Text className="mb-3 text-base font-semibold text-ink">Dein Tier-Freund</Text>
        <View className="flex-row flex-wrap justify-start gap-2">
          {AVATAR_IDS.map((id) => {
            const selected = id === avatar;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Avatar ${id}`}
                onPress={() => {
                  setAvatar(id);
                  void Haptics.selectionAsync();
                }}
                className={`h-16 w-[22%] items-center justify-center rounded-2xl ${
                  selected ? 'bg-secondary' : 'bg-primary-soft'
                }`}
              >
                <Text className="text-3xl">{AVATAR_EMOJI[id]}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Button
        label={profilesCount > 0 ? 'Kind hinzufügen' : 'Los geht’s – erste Übung!'}
        onPress={() => void finish()}
        disabled={saving}
      />
    </ScreenContainer>
  );
}
