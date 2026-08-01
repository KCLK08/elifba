import { Text, View } from 'react-native';

import type { ContentCard } from '@/content';
import { ARABIC_FONT_FAMILY } from '@/constants/arabicFonts';
import { colors, typography } from '@/constants/theme';

import {
  resolveArabicColoringMode,
  resolveHighlightMode,
  resolveHighlightTargets,
} from './arabicColoring';
import { mergeHighlightIndices, splitPositionHighlight } from './arabicDisplay';
import { normalizeArabicDisplay, segmentGraphemes } from './graphemes';
import { PositionHighlightText } from './PositionHighlightText';

/** Red marking for pedagogical highlights (dumpfe Buchstaben, Position, Vokale). */
const MARKING_COLOR = colors.error;

interface ArabicLetterViewProps {
  card: ContentCard;
  exerciseId?: string;
  lessonId?: string;
}

/**
 * Large RTL Arabic display, centered in the card.
 *
 * Coloring is lesson-specific: only L1 (dumpfe Buchstaben), L2 (Position), and
 * L3 Fetha Einzelnd (Vokalzeichen) use red markings. All other lessons stay black.
 */
export function ArabicLetterView({ card, exerciseId, lessonId }: ArabicLetterViewProps) {
  const arabic = normalizeArabicDisplay(card.arabic);
  const graphemes = segmentGraphemes(arabic);
  const fontSize = typography.arabicLarge;
  const lineHeight = Math.round(fontSize * 1.45);

  const coloringMode = resolveArabicColoringMode(exerciseId, lessonId);
  const highlightTargets = resolveHighlightTargets(coloringMode, card.target);
  const highlightMode = resolveHighlightMode(coloringMode, card.highlightMode);
  const highlight = mergeHighlightIndices(arabic, highlightTargets, highlightMode);

  const positionSegments = highlightMode
    ? splitPositionHighlight(arabic, highlightTargets, highlightMode)
    : null;

  const colorsPerGrapheme = graphemes.map((_, index) =>
    highlight.has(index) ? MARKING_COLOR : colors.ink,
  );
  const hasMixedColors = new Set(colorsPerGrapheme).size > 1;
  const needsSplit = !positionSegments && hasMixedColors;
  const displayColor = colorsPerGrapheme[0] ?? colors.ink;

  const baseTextStyle = {
    writingDirection: 'rtl' as const,
    textAlign: 'center' as const,
    fontFamily: ARABIC_FONT_FAMILY,
    fontSize,
    fontWeight: '700' as const,
    lineHeight,
    includeFontPadding: false,
  };

  return (
    <View className="w-full items-center justify-center rounded-card bg-card px-3 py-8">
      <View
        className="min-h-[140px] w-full items-center justify-center"
        style={{ direction: 'rtl' }}
        accessibilityRole="text"
        accessibilityLabel={`Arabisch: ${arabic}`}
      >
        {positionSegments ? (
          <PositionHighlightText
            segments={positionSegments}
            baseTextStyle={baseTextStyle}
            highlightColor={MARKING_COLOR}
          />
        ) : needsSplit ? (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.45}
            style={{ ...baseTextStyle, color: colors.ink, alignSelf: 'stretch' }}
          >
            {graphemes.map((grapheme, index) => (
              <Text
                key={`${card.id}-${index}`}
                style={{
                  ...baseTextStyle,
                  color: colorsPerGrapheme[index],
                }}
              >
                {grapheme}
              </Text>
            ))}
          </Text>
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
