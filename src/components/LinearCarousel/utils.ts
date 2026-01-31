export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getItemPosition(
  index: number,
  gap: number,
  direction: "horizontal" | "vertical"
): readonly [number, number, number] {
  const offset = index * (1 + gap);
  return direction === "horizontal"
    ? ([offset, 0, 0] as const)
    : ([0, offset, 0] as const);
}
