// lib/category-elements.ts

export function getElementThresholds(costToNextLevel: number, elementCount: number): number[] {
  if (elementCount <= 0) return [];
  const segments = elementCount + 1;
  return Array.from({ length: elementCount }, (_, i) =>
    Math.ceil(((i + 1) * costToNextLevel) / segments)
  );
}

export function getPointsWithinCurrentLevel(pointsInLevel: number, pointsToNextLevel: number): number {
  return Math.min(pointsInLevel, pointsToNextLevel);
}
