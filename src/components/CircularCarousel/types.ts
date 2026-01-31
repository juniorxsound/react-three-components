import type { ReactNode } from "react";

export type DragConfig = {
  /** Axis to constrain drag movement. Default: "x" */
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

export type CircularCarouselProps = {
  children: ReactNode;
  radius?: number;
  axis?: "x" | "y" | "z";
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  dragEnabled?: boolean;
  dragSensitivity?: number;
  /** Axis for drag gesture. Default: "x" */
  dragAxis?: "x" | "y";
  /** Additional drag gesture configuration */
  dragConfig?: DragConfig;
};

export type CircularCarouselRef = {
  next(): void;
  prev(): void;
  goTo(index: number): void;
};

export type CarouselContextValue = {
  activeIndex: number;
  count: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
};
