/**
 * Elifba Kids – Design Tokens (Phase 2 Basis)
 * Kindgerechte, ruhige Farbwelt (Teal + Amber), keine Web-App-Kopie.
 */

export const colors = {
  primary: '#0F766E',
  secondary: '#F59E0B',
  background: '#F0FDFA',
  card: '#FFFFFF',
  success: '#22C55E',
  warning: '#F97316',
  error: '#DC2626',
  /** Text / supporting */
  ink: '#134E4A',
  inkMuted: '#5F8A85',
  primarySoft: '#CCFBF1',
  secondarySoft: '#FEF3C7',
  successSoft: '#DCFCE7',
  warningSoft: '#FFEDD5',
  errorSoft: '#FEE2E2',
  white: '#FFFFFF',
} as const;

export const typography = {
  /** Hero letter size — dominant focus on trainer screens */
  arabicLarge: 112,
  /** Words / groups — still large, readable on small phones */
  arabicMedium: 64,
  heading: 28,
  body: 16,
  caption: 14,
} as const;

/** Card status colors in trainer progress strip */
export const cardStatusColors = {
  unbeantwortet: '#E5E7EB',
  /** Falsch — visibly distinct from neutral */
  falsch: '#F87171',
  unsicher: '#FBBF24',
  richtig: '#86EFAC',
  gelernt: '#15803D',
} as const;

export const spacing = {
  small: 8,
  medium: 16,
  large: 24,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const touch = {
  minHeight: 56,
  iconButton: 56,
} as const;

export type ThemeColors = typeof colors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;
