import type { ReactNode } from "react";

export type DragConfig = {
  /** Axis to constrain drag movement */
  axis?: "x" | "y";
  /** Pointer options for drag gesture */
  pointer?: { touch?: boolean; capture?: boolean; keys?: boolean };
  /** Touch action CSS property. Default: "none" */
  touchAction?: string;
  /** Threshold in pixels before drag starts */
  threshold?: number;
  /** Rubberband effect when dragging past bounds (0-1) */
  rubberband?: boolean | number;
};

export type LinearCarouselProps = {
  children: ReactNode;
  gap?: number;
  direction?: "horizontal" | "vertical";
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  dragEnabled?: boolean;
  dragSensitivity?: number;
  /** Axis for drag gesture. Default: derived from direction ("x" for horizontal, "y" for vertical) */
  dragAxis?: "x" | "y";
  /** Additional drag gesture configuration */
  dragConfig?: DragConfig;
};

export type LinearCarouselRef = {
  next(): void;
  prev(): void;
  goTo(index: number): void;
};

export type LinearCarouselContextValue = {
  activeIndex: number;
  count: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
};
