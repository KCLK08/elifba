import { Text, View } from 'react-native';

import { Button, Modal } from '@/components/ui';
import type { SessionLimit } from '@/store/exerciseSettingsStore';
import type { TrainerMode } from '@/types';

interface TrainerSettingsModalProps {
  visible: boolean;
  sessionLimit: SessionLimit;
  mode: TrainerMode;
  onClose: () => void;
  onChangeLimit: (limit: SessionLimit) => void;
  onChangeMode: (mode: TrainerMode) => void;
}

const LIMITS: SessionLimit[] = [10, 20, 30, 'all'];

export function TrainerSettingsModal({
  visible,
  sessionLimit,
  mode,
  onClose,
  onChangeLimit,
  onChangeMode,
}: TrainerSettingsModalProps) {
  return (
    <Modal visible={visible} title="Übungs-Einstellungen" onClose={onClose}>
      <Text className="mb-2 text-base font-bold text-ink">Karten pro Session</Text>
      <View className="mb-4 gap-2">
        {LIMITS.map((limit) => (
          <Button
            key={String(limit)}
            label={limit === 'all' ? `Alle${sessionLimit === 'all' ? ' ✓' : ''}` : `${limit}${sessionLimit === limit ? ' ✓' : ''}`}
            variant={sessionLimit === limit ? 'secondary' : 'ghost'}
            size="md"
            onPress={() => onChangeLimit(limit)}
          />
        ))}
      </View>

      <Text className="mb-2 text-base font-bold text-ink">Abfragemodus</Text>
      <View className="mb-4 gap-2">
        <Button
          label={`Reihenfolge${mode === 'sequence' ? ' ✓' : ''}`}
          variant={mode === 'sequence' ? 'secondary' : 'ghost'}
          size="md"
          onPress={() => onChangeMode('sequence')}
        />
        <Button
          label={`Zufällig${mode === 'shuffle' ? ' ✓' : ''}`}
          variant={mode === 'shuffle' ? 'secondary' : 'ghost'}
          size="md"
          onPress={() => onChangeMode('shuffle')}
        />
      </View>

      <Text className="mb-3 text-sm text-ink-muted">
        Änderungen starten die Session neu. Dein gespeicherter Lernfortschritt bleibt erhalten.
      </Text>
      <Button label="Fertig" onPress={onClose} />
    </Modal>
  );
}
