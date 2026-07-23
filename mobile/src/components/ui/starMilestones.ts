/** How many of the 3 exercise stars are earned for a learned%. */
export function starsEarnedFromProgress(progress: number): number {
  const clamped = Math.max(0, Math.min(100, progress));
  if (clamped >= 100) return 3;
  if (clamped >= 66) return 2;
  if (clamped >= 33) return 1;
  return 0;
}
