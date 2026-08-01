import { Pressable, Text, TextInput, View } from 'react-native';

import { Button, Modal } from '@/components/ui';

import { BETA_ISSUE_LABELS, type BetaIssueCategory } from './types';

interface BetaIssueModalProps {
  visible: boolean;
  arabic: string;
  category: BetaIssueCategory;
  note: string;
  isEditing: boolean;
  onChangeCategory: (category: BetaIssueCategory) => void;
  onChangeNote: (note: string) => void;
  onSave: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const CATEGORIES: BetaIssueCategory[] = ['audio', 'letters', 'both'];

export function BetaIssueModal({
  visible,
  arabic,
  category,
  note,
  isEditing,
  onChangeCategory,
  onChangeNote,
  onSave,
  onRemove,
  onClose,
}: BetaIssueModalProps) {
  return (
    <Modal
      visible={visible}
      title="Was ist falsch?"
      message={`Karte: ${arabic}`}
      onClose={onClose}
    >
      <Text className="mb-3 text-center text-sm font-semibold text-ink-muted">
        Betatest — Fehler an Entwickler melden
      </Text>

      <View className="mb-4 gap-2">
        {CATEGORIES.map((item) => {
          const selected = category === item;
          return (
            <Pressable
              key={item}
              onPress={() => onChangeCategory(item)}
              className={`rounded-2xl px-4 py-3 ${
                selected ? 'bg-primary-soft border-2 border-primary' : 'bg-background border border-transparent'
              }`}
            >
              <Text className={`text-center text-base font-bold ${selected ? 'text-primary' : 'text-ink'}`}>
                {BETA_ISSUE_LABELS[item]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mb-2 text-sm font-semibold text-ink">Kurzbeschreibung (optional)</Text>
      <TextInput
        value={note}
        onChangeText={onChangeNote}
        placeholder="z. B. Audio knistert / falscher Buchstabe …"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        className="mb-4 min-h-[88px] rounded-2xl border border-primary-soft bg-background px-4 py-3 text-base text-ink"
      />

      <View className="gap-3">
        <Button label={isEditing ? 'Markierung speichern' : 'Karte markieren'} onPress={onSave} />
        {isEditing ? (
          <Button label="Markierung entfernen" variant="danger" onPress={onRemove} />
        ) : null}
        <Button label="Abbrechen" variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}
