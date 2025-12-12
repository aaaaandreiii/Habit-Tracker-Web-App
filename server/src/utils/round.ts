export function roundUpToTwo(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;

  // Guard against floating-point artifacts (e.g., 1.005 * 100)
  const scaled = value * 100;
  const epsilon = 1e-9;
  return Math.ceil(scaled - epsilon) / 100;
}

export function formatUpToTwo(value: number): string {
  return roundUpToTwo(value).toFixed(2);
}
