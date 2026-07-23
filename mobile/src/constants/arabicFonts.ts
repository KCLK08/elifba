/**
 * Arabic typography preparation.
 * Custom fonts can be registered via expo-font later.
 */
export const ARABIC_FONT_FAMILY = undefined as string | undefined;

export const ARABIC_FONT_CANDIDATES = {
  regular: 'NotoNaskhArabic-Regular',
  bold: 'NotoNaskhArabic-Bold',
} as const;

export const arabicBaseStyle = {
  writingDirection: 'rtl' as const,
  textAlign: 'center' as const,
  fontFamily: ARABIC_FONT_FAMILY,
};
