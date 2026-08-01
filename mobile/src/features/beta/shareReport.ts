import { Platform, Share } from 'react-native';

export async function shareBetaReport(
  text: string,
): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return 'copied';
      }
      return 'failed';
    }

    await Share.share({
      title: 'Elifba Betatest-Report',
      message: text,
    });
    return 'shared';
  } catch {
    return 'failed';
  }
}
