/** Extra headroom above the line box so damma / shadda are not clipped. */
const HARAKAT_TOP_RATIO = 0.1;
/** Line height for large trainer Arabic — room for harakat above and below. */
const TRAINER_LINE_HEIGHT_RATIO = 1.65;

export interface ArabicTrainerMetrics {
  fontSize: number;
  lineHeight: number;
  harakatTopInset: number;
  minDisplayHeight: number;
}

export function resolveArabicTrainerMetrics(fontSize: number): ArabicTrainerMetrics {
  const harakatTopInset = Math.round(fontSize * HARAKAT_TOP_RATIO);
  const lineHeight = Math.round(fontSize * TRAINER_LINE_HEIGHT_RATIO);
  return {
    fontSize,
    lineHeight,
    harakatTopInset,
    minDisplayHeight: lineHeight + harakatTopInset,
  };
}
