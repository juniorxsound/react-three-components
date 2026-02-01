import { TAU } from "./constants";

export function getItemTransform(
  index: number,
  count: number,
  radius: number,
  axis: "x" | "y" | "z"
) {
  const angle = (index / count) * TAU;
  const c = Math.cos(angle) * radius;
  const s = Math.sin(angle) * radius;
  const pos =
    axis === "y"
      ? ([s, 0, c] as const)
      : axis === "x"
        ? ([0, c, s] as const)
        : ([c, s, 0] as const);
  const rot =
    axis === "y"
      ? ([0, Math.PI + angle, 0] as const)
      : axis === "x"
        ? ([Math.PI + angle, 0, 0] as const)
        : ([0, 0, Math.PI + angle] as const);
  return { position: pos, rotation: rot };
}

export function calculateShortestPath(
  currentOffset: number,
  targetLogical: number
): number {
  const n = Math.round((currentOffset - targetLogical) / TAU);
  return targetLogical + n * TAU;
}
