import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Modal, ScreenContainer } from '@/components/ui';
import { ProfileForm } from '@/features/profile/ProfileForm';
import { useProfileStore } from '@/store/profileStore';

export function ProfileEditScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const profile = useProfileStore((s) => s.profiles.find((p) => p.id === profileId) ?? null);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const deleteProfile = useProfileStore((s) => s.deleteProfile);
  const profilesCount = useProfileStore((s) => s.profiles.length);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!profile) {
    return (
      <ScreenContainer>
        <Text className="mb-4 text-center text-lg text-ink-muted">Profil nicht gefunden.</Text>
        <Button label="Zurück" variant="ghost" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const onDelete = async () => {
    setDeleting(true);
    try {
      const hasProfilesLeft = await deleteProfile(profile.id);
      setConfirmDelete(false);
      if (hasProfilesLeft) {
        router.replace('/(tabs)/profile');
      } else {
        router.replace('/onboarding');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenContainer>
      <Text className="mb-2 text-center text-sm font-semibold text-primary">Profil bearbeiten</Text>
      <Text className="mb-8 text-center text-[32px] font-bold text-ink">{profile.name}</Text>

      <ProfileForm
        initialName={profile.name}
        initialAvatar={profile.avatar}
        submitLabel="Speichern"
        onSubmit={async ({ name, avatar }) => {
          await updateProfile(profile.id, { name, avatar });
          router.back();
        }}
      />

      <View className="mt-8">
        <CardLikeDangerZone
          profileName={profile.name}
          isLastProfile={profilesCount <= 1}
          onDelete={() => setConfirmDelete(true)}
        />
      </View>

      <Modal
        visible={confirmDelete}
        title="Profil löschen?"
        message={
          profilesCount <= 1
            ? `„${profile.name}“ und der gesamte Fortschritt werden gelöscht. Danach legst du ein neues Profil an.`
            : `„${profile.name}“ und der gesamte Fortschritt werden gelöscht. Das kannst du nicht rückgängig machen.`
        }
        onClose={() => setConfirmDelete(false)}
      >
        <View className="gap-3">
          <Button
            label="Ja, Profil löschen"
            variant="danger"
            disabled={deleting}
            onPress={() => void onDelete()}
          />
          <Button label="Abbrechen" variant="ghost" onPress={() => setConfirmDelete(false)} />
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function CardLikeDangerZone({
  profileName,
  isLastProfile,
  onDelete,
}: {
  profileName: string;
  isLastProfile: boolean;
  onDelete: () => void;
}) {
  return (
    <View className="rounded-card border border-error bg-card p-5">
      <Text className="mb-2 text-lg font-bold text-ink">Profil löschen</Text>
      <Text className="mb-4 text-base text-ink-muted">
        {isLastProfile
          ? `Löscht „${profileName}“ inklusive Sterne und Übungsfortschritt. Du wirst zum Anlegen eines neuen Profils weitergeleitet.`
          : `Löscht „${profileName}“ inklusive Sterne und Übungsfortschritt auf diesem Gerät.`}
      </Text>
      <Button label="Profil löschen" variant="danger" onPress={onDelete} />
    </View>
  );
}
