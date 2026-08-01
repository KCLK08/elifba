import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Modal } from '@/components/ui';

import { formatBetaReportText } from './formatReport';
import { shareBetaReport } from './shareReport';
import type { BetaExerciseReport } from './types';

interface BetaReportModalProps {
  visible: boolean;
  report: BetaExerciseReport;
  onClose: () => void;
}

export function BetaReportModal({ visible, report, onClose }: BetaReportModalProps) {
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');
  const reportText = formatBetaReportText(report);

  const onShare = async () => {
    const result = await shareBetaReport(reportText);
    setStatus(result);
  };

  return (
    <Modal
      visible={visible}
      title="Betatest-Report"
      message={`${report.issues.length} Karte(n) gemeldet — bitte an das Team senden.`}
      onClose={onClose}
    >
      <ScrollView className="mb-4 max-h-64 rounded-2xl bg-background p-3">
        <Text className="font-mono text-xs text-ink" selectable>
          {reportText}
        </Text>
      </ScrollView>

      {status === 'shared' ? (
        <Text className="mb-3 text-center text-sm font-semibold text-success">
          Report geteilt — danke!
        </Text>
      ) : null}
      {status === 'copied' ? (
        <Text className="mb-3 text-center text-sm font-semibold text-success">
          Report in Zwischenablage kopiert — bitte einfügen und senden.
        </Text>
      ) : null}
      {status === 'failed' ? (
        <Text className="mb-3 text-center text-sm font-semibold text-error">
          Teilen fehlgeschlagen — Text oben markieren und manuell kopieren.
        </Text>
      ) : null}

      <View className="gap-3">
        <Button label="Report teilen / kopieren" onPress={() => void onShare()} />
        <Button label="Fertig" variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}
