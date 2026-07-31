import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Avatar, Button, Card } from '@/components/ui';
import { AVATAR_EMOJI, AVATAR_IDS } from '@/constants/avatars';
import type { AvatarId } from '@/types';

export interface ProfileFormValues {
  name: string;
  avatar: AvatarId;
}

interface ProfileFormProps {
  initialName?: string;
  initialAvatar?: AvatarId;
  submitLabel: string;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  disabled?: boolean;
}

export function ProfileForm({
  initialName = '',
  initialAvatar = 'fox',
  submitLabel,
  onSubmit,
  disabled = false,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<AvatarId>(initialAvatar);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (saving || disabled) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim() || 'Freund', avatar });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View className="mb-8 items-center">
        <Avatar avatar={avatar} size="lg" />
      </View>

      <Card className="mb-5">
        <Text className="mb-2 text-base font-semibold text-ink">Name</Text>
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
        <Text className="mb-3 text-base font-semibold text-ink">Tier-Freund</Text>
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

      <Button label={submitLabel} onPress={() => void handleSubmit()} disabled={saving || disabled} />
    </>
  );
}
