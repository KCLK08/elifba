import { Modal as RNModal, Pressable, Text, View } from 'react-native';

interface AppModalProps {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function Modal({ visible, title, message, onClose, children }: AppModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={onClose}>
        <Pressable
          className="w-full rounded-card bg-card p-6"
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="mb-2 text-center text-2xl font-bold text-ink">{title}</Text>
          {message ? (
            <Text className="mb-4 text-center text-base text-ink-muted">{message}</Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
