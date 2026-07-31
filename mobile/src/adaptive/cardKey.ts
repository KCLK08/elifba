export function adaptiveCardKey(
  profileId: string,
  exerciseId: string,
  cardId: string,
): string {
  return `${profileId}::${exerciseId}::${cardId}`;
}

export function virtualWeaknessCardId(exerciseId: string, cardId: string): string {
  return `${exerciseId}::${cardId}`;
}

export function parseVirtualWeaknessCardId(
  virtualId: string,
): { exerciseId: string; cardId: string } | null {
  const sep = virtualId.indexOf('::');
  if (sep <= 0) return null;
  return {
    exerciseId: virtualId.slice(0, sep),
    cardId: virtualId.slice(sep + 2),
  };
}
