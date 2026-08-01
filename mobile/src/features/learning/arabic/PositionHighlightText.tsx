import type { TextStyle } from 'react-native';

import { colors } from '@/constants/theme';

import type { PositionHighlightSegments } from './arabicDisplay';
import { segmentsToColorRuns } from './arabicDisplay';
import { ColoredArabicText } from './ColoredArabicText';

interface PositionHighlightTextProps {
  segments: PositionHighlightSegments;
  baseTextStyle: TextStyle;
  inkColor?: string;
  highlightColor?: string;
}

/**
 * Highlight one letter inside a connected Arabic word (Lektion 2).
 * Delegates to ColoredArabicText so cursive shaping stays intact.
 */
export function PositionHighlightText({
  segments,
  baseTextStyle,
  inkColor = colors.ink,
  highlightColor = colors.error,
}: PositionHighlightTextProps) {
  const runs = segmentsToColorRuns(segments, inkColor, highlightColor);
  return <ColoredArabicText runs={runs} baseTextStyle={baseTextStyle} />;
}
