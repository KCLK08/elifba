import { Platform, Text, View } from 'react-native';

import type { ContentCard } from '@/content';
import { ARABIC_FONT_FAMILY } from '@/constants/arabicFonts';
import { colors, typography } from '@/constants/theme';

import {
  colorForLesson1Grapheme,
  MARKING_COLOR,
  resolveArabicColoringMode,
  resolveHighlightMode,
  resolveHighlightTargets,
} from './arabicColoring';
import {
  buildArabicTrainerTextStyle,
  mergeHighlightIndices,
  resolveArabicTrainerMetrics,
  splitPositionHighlight,
  buildArabicColorRuns,
} from './arabicDisplay';
import { normalizeArabicDisplay, segmentGraphemes } from './graphemes';
import { ColoredArabicText } from './ColoredArabicText';
import { PositionHighlightText } from './PositionHighlightText';

interface ArabicLetterViewProps {
  card: ContentCard;
  exerciseId?: string;
  lessonId?: string;
}

/**
 * Large RTL Arabic display, centered in the card.
 *
 * Coloring is lesson-specific: L1 (dumpfe + Lispel + ر), L2 (Position), L3 Fetha
 * Einzelnd (Vokalzeichen). All other lessons stay black.
 * Multi-color text uses ColoredArabicText so cursive joins stay intact.
 */
export function ArabicLetterView({ card, exerciseId, lessonId }: ArabicLetterViewProps) {
  const arabic = normalizeArabicDisplay(card.arabic);
  const graphemes = segmentGraphemes(arabic);
  const fontSize = typography.arabicLarge;
  const { minDisplayHeight } = resolveArabicTrainerMetrics(fontSize);

  const coloringMode = resolveArabicColoringMode(exerciseId, lessonId);
  const highlightTargets = resolveHighlightTargets(coloringMode, card.target);
  const highlightMode = resolveHighlightMode(coloringMode, card.highlightMode);
  const highlight = mergeHighlightIndices(arabic, highlightTargets, highlightMode);

  const positionSegments = highlightMode
    ? splitPositionHighlight(arabic, highlightTargets, highlightMode)
    : null;

  const colorsPerGrapheme = graphemes.map((_, index) => {
    if (coloringMode === 'lesson1-emphatic') {
      return colorForLesson1Grapheme(index, highlight, card.tags);
    }
    return highlight.has(index) ? MARKING_COLOR : colors.ink;
  });
  const hasMixedColors = new Set(colorsPerGrapheme).size > 1;
  const useShapedColors = !positionSegments && hasMixedColors;
  const colorRuns = useShapedColors
    ? buildArabicColorRuns(graphemes, colorsPerGrapheme)
    : [];
  const displayColor = colorsPerGrapheme[0] ?? colors.ink;

  const baseTextStyle = {
    ...buildArabicTrainerTextStyle(fontSize),
    fontFamily: ARABIC_FONT_FAMILY,
    includeFontPadding: Platform.OS === 'android',
  };

  return (
    <View className="w-full items-center justify-center rounded-card bg-card px-3 py-8">
      <View
        className="w-full items-center justify-center"
        style={{ direction: 'rtl', minHeight: minDisplayHeight, overflow: 'visible' }}
        accessibilityRole="text"
        accessibilityLabel={`Arabisch: ${arabic}`}
      >
        {positionSegments ? (
          <PositionHighlightText
            segments={positionSegments}
            baseTextStyle={baseTextStyle}
            highlightColor={MARKING_COLOR}
          />
        ) : useShapedColors ? (
          <ColoredArabicText runs={colorRuns} baseTextStyle={baseTextStyle} />
        ) : (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.45}
            style={{
              ...baseTextStyle,
              color: displayColor,
              alignSelf: 'stretch',
            }}
          >
            {arabic}
          </Text>
        )}
      </View>
    </View>
  );
}
