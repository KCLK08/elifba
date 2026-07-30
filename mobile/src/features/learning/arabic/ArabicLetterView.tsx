import { Text, View } from 'react-native';

import type { ContentCard } from '@/content';
import { ARABIC_FONT_FAMILY } from '@/constants/arabicFonts';
import { colors, typography } from '@/constants/theme';

import { mergeHighlightIndices } from './arabicDisplay';
import { normalizeArabicDisplay, segmentGraphemes } from './graphemes';

interface ArabicLetterViewProps {
  card: ContentCard;
}

function colorForGrapheme(
  index: number,
  highlight: Set<number>,
  tags: string[] | undefined,
): string {
  if (highlight.has(index)) return colors.warning;
  if (tags?.includes('lispel')) return '#2563EB';
  if (tags?.includes('accentGreen')) return colors.success;
  return colors.ink;
}

/**
 * Large RTL Arabic display, centered in the card.
 *
 * Important: Arabic cursive joining only works inside a single text run.
 * Nested <Text> per grapheme breaks connections in words and letter groups.
 * Multi-grapheme cards (Buchstabengruppen, Lektion-2-Wörter, Tatweel-Formen)
 * always use one Text run; per-grapheme color is only used for isolated letters.
 */
export function ArabicLetterView({ card }: ArabicLetterViewProps) {
  const arabic = normalizeArabicDisplay(card.arabic);
  const graphemes = segmentGraphemes(arabic);
  const isWord = graphemes.length > 2 || Boolean(card.highlightMode);
  const fontSize = isWord ? typography.arabicMedium : typography.arabicLarge;
  const highlight = mergeHighlightIndices(arabic, card.target, card.highlightMode);
  const lineHeight = Math.round(fontSize * 1.45);

  const colorsPerGrapheme = graphemes.map((_, index) =>
    colorForGrapheme(index, highlight, card.tags),
  );
  const hasMixedColors = new Set(colorsPerGrapheme).size > 1;
  const isConnectedText = graphemes.length > 1;
  const needsSplit = !isConnectedText && hasMixedColors;
  const displayColor = hasMixedColors
    ? colors.ink
    : (colorsPerGrapheme[0] ?? colors.ink);

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
        {needsSplit ? (
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
